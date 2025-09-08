import { RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { COMPANY_NAME } from '../config/environments'
import { Vpc, InterfaceVpcEndpointAwsService, SecurityGroup, SubnetType, Peer, Port, NatProvider } from 'aws-cdk-lib/aws-ec2'

export interface PrereqsStackProps extends StackProps {
  vpcName: string
}

export class PrereqsStack extends Stack {
  constructor(scope: Construct, id: string, props: PrereqsStackProps) {
    super(scope, id, props)
    Tags.of(this).add('company', COMPANY_NAME)

    // Define the NAT Gateway provider for the VPC
    const natGatewayProvider = NatProvider.gateway();

    const vpc = new Vpc(this, 'demoVpc', {
      maxAzs: 3,
      natGatewayProvider, 
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS, 
        },
      ],
    })
  }
}
