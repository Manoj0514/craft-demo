import { RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { COMPANY_NAME } from '../config/environments'
import { Vpc, InterfaceVpcEndpointAwsService, SecurityGroup, SubnetType, Peer, Port } from 'aws-cdk-lib/aws-ec2'

export interface PrereqsStackProps extends StackProps {
  vpcName: string
}

export class PrereqsStack extends Stack {

  constructor(scope: Construct, id: string, props: PrereqsStackProps) {
    super(scope, id, props)
    Tags.of(this).add('company', COMPANY_NAME)
    
    const vpc = new Vpc(this, 'demoVpc', {
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    })

    const securityGroup = new SecurityGroup(this, 'flaskApp', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'flaskApp',
    })

    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(5000), 'Allow HTTP traffic')

    vpc.addInterfaceEndpoint('secretsEndpoint', {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      securityGroups: [securityGroup],
    })
  }
}
