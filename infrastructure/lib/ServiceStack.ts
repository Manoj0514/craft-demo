import { Stack, StackProps, Tags, Duration } from 'aws-cdk-lib'
import { Vpc, SecurityGroup, InterfaceVpcEndpointAwsService, InstanceType, MachineImage, SubnetType, LaunchTemplate, UserData } from 'aws-cdk-lib/aws-ec2'
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam'
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling'
import { Construct } from 'constructs'
import { COMPANY_NAME } from '../config/environments'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationListener, ApplicationTargetGroup, TargetType, ListenerAction } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets'

export interface ServiceStackProps extends StackProps {
  vpcName: string
}

export class ServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props)
    
    // Tag all resources with the company name
    Tags.of(this).add('company', COMPANY_NAME)

    // Reference VPC by name created from prereqs stack
    const vpc = Vpc.fromLookup(this, 'vpc', {
      vpcName: props.vpcName,
    })

    // Select private and public subnets in the VPC
    const subnets = vpc.selectSubnets({ subnetGroupName: 'Private' })
    const albSubnets = vpc.selectSubnets({ subnetGroupName: 'Public' })

    // Create a security group for the application
    const securityGroup = new SecurityGroup(this, 'flaskApp', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'flaskApp',
    })

    // Add an interface endpoint for AWS Secrets Manager within the VPC
    vpc.addInterfaceEndpoint('secretsEndpoint', {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      securityGroups: [securityGroup],
    })

    // Creates an application load balancer
    const alb = new ApplicationLoadBalancer(this, 'alb', {
      vpc: vpc,
      internetFacing: true, // Internet-facing load balancer
      vpcSubnets: albSubnets,
    })

    // Lookup the existing public hosted zone
    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'craftdemo.click', // Replace with the actual domain name if different
    })

    //  weighted A Record for the ALB in the hosted zone 
    new ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(alb)),
      recordName: 'intuit', 
      ttl: Duration.minutes(1), 
      weight: 50, // Weighted routing policy with value 50
      setIdentifier: `alb-${Stack.of(this).region}-50`,
    })

    // Creating a secret in AWS Secrets Manager for flask app
    const craftSecret = new Secret(this, 'craftSecret', {
      secretName: 'craft-demo-secret',
    })

    // IAM role for EC2 instance
    const instanceRole = new Role(this, 'InstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
    })

    // Attach additional policies to the instance role
    instanceRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'))
    instanceRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'))

    // Grant read access to the secret for the instance role
    craftSecret.grantRead(instanceRole)

    // User data script to configure EC2 instance on startup
    const userData = UserData.custom(
      `#!/bin/bash
      amazon-linux-extras install epel -y
      sudo yum update -y
      sudo yum install python3-pip -y
      pip3 install flask boto3 awscli -q

      # Set environment variables
      export FLASK_APP=/home/ec2-user/app.py
      export AWS_REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
      export API_KEY=$(aws secretsmanager get-secret-value \
      --secret-id craft-demo-secret \
      --query 'SecretString' \
      --output text \
      --region $AWS_REGION)
      export AWS_AVAILABILITY_ZONE=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
      

      echo $API_KEY

      # Retrieve app code from S3
      aws s3 cp s3://flask-app-resources/destination/app.py /home/ec2-user/app.py

      # Start Flask application
      nohup flask run --host=0.0.0.0 &
      `
    )

    // Launch template for EC2 instances
    const launchTemplate = new LaunchTemplate(this, 'LaunchTemplate', {
      machineImage: MachineImage.latestAmazonLinux2(),
      instanceType: new InstanceType('t3.micro'),
      securityGroup,
      role: instanceRole,
      userData,
      keyName: 'firstkey',
    })

    // Auto-scaling group using the launch template
    const asg = new AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc,
      launchTemplate,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      desiredCapacity: 1,
    })

    // Application target group
    const targetGroup = new ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 5000,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.INSTANCE,
      healthCheck: {
        port: '5000',
        path: '/',
      },
    })

    // Application listener for the load balancer
    const listener = new ApplicationListener(this, 'Listener', {
      loadBalancer: alb,
      protocol: ApplicationProtocol.HTTP,
      defaultAction: ListenerAction.forward([targetGroup]),
    })

    // Attach the auto-scaling group to the target group
    asg.attachToApplicationTargetGroup(targetGroup)
  }
}
