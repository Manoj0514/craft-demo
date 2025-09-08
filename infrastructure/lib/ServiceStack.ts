import { Stack, StackProps, Tags } from 'aws-cdk-lib'
import { Vpc, SecurityGroup, Peer, Port, InterfaceVpcEndpointAwsService, InstanceType, MachineImage, SubnetType, LaunchTemplate, UserData } from 'aws-cdk-lib/aws-ec2'
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam'
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling'
import { Construct } from 'constructs'
import { COMPANY_NAME } from '../config/environments'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationListener, ApplicationTargetGroup, TargetType } from 'aws-cdk-lib/aws-elasticloadbalancingv2'

export interface ServiceStackProps extends StackProps {
  vpcName: string
}

export class ServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props)
    Tags.of(this).add('company', COMPANY_NAME)

    const vpc = Vpc.fromLookup(this, 'vpc', {
      vpcName: props.vpcName,
    })

    const subnets = vpc.selectSubnets({ subnetGroupName: 'Public' })

    const securityGroup = new SecurityGroup(this, 'flaskApp', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'flaskApp',
    })

    // Allow HTTP traffic
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(5000), 'Allow HTTP traffic')

    // Allow SSH from specific IP
    securityGroup.addIngressRule(Peer.ipv4('73.196.208.53/32'), Port.tcp(22), 'Allow SSH from specific IP')

    vpc.addInterfaceEndpoint('secretsEndpoint', {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      securityGroups: [securityGroup],
    })

    const alb = new ApplicationLoadBalancer(this, 'alb', {
      vpc: vpc,
      internetFacing: true,
      vpcSubnets: subnets,
    })


    const mySecret = new Secret(this, 'craftSecret', {
      secretName: 'craft-demo-secret',
    })

    const instanceRole = new Role(this, 'InstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
    })

    instanceRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'))
    instanceRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));

    // Allow the instance role to read from this secret
    mySecret.grantRead(instanceRole)

    const userData = UserData.custom(`#!/bin/bash
      amazon-linux-extras install epel -y
      yum update -y
      yum install python3-pip -y
      pip3 install flask boto3

      export API_KEY=$(aws secretsmanager get-secret-value --secret-id craft-demo-secret --query 'SecretString' --output text --region us-east-2)

      aws s3 cp s3://flask-app-resources/destination/app.py /home/ec2-user/app.py
      FLASK_APP=/home/ec2-user/app.py nohup flask run --host=0.0.0.0 &
    `)

    const launchTemplate = new LaunchTemplate(this, 'LaunchTemplate', {
      machineImage: MachineImage.latestAmazonLinux2(),
      instanceType: new InstanceType('t3.micro'),
      securityGroup,
      role: instanceRole,
      userData,
      keyName: 'firstkey',
    })

    const asg = new AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc,
      launchTemplate,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      desiredCapacity: 1,
    })

    // Create a target group
    // const targetGroup = new ApplicationTargetGroup(this, 'TargetGroup', {
    //   vpc,
    //   targetType: TargetType.INSTANCE,
    //   port: 5000,
    //   protocol: ApplicationProtocol.HTTP,
    //   healthCheck: {
    //     port: '5000',
    //   },
    // })

    // // Add the ASG instances to the target group
    // asg.attachToApplicationTargetGroup(targetGroup)

    // // Add a listener to the load balancer
    // const listener = alb.addListener('Listener', {
    //   port: 80,
    //   open: true,
    // })

    // // Forward traffic from the listener to the target group
    // listener.addTargets('Targets', {
    //   targetGroupName: targetGroup.targetGroupName,
    //   targets: [asg],
    // })
  }
}

