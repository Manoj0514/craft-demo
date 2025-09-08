import { RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { COMPANY_NAME } from '../config/environments'
import { Vpc, SubnetType, NatProvider } from 'aws-cdk-lib/aws-ec2'

// Interface for the stack properties, extending AWS CDK StackProps
export interface PrereqsStackProps extends StackProps {
  vpcName: string
}

// Class defining the PrereqsStack extending the AWS CDK Stack class
export class PrereqsStack extends Stack {
  constructor(scope: Construct, id: string, props: PrereqsStackProps) {
    super(scope, id, props)
    
    // Add a tag with the company name to all resources
    Tags.of(this).add('company', COMPANY_NAME)

    // Define the NAT Gateway provider for the VPC
    const natGatewayProvider = NatProvider.gateway()

    // Create a new VPC resource
    const vpc = new Vpc(this, 'demoVpc', {
      vpcName: 'craft-demo-vpc',
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
