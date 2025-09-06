import { Duration, Stack, StackProps, Tags, RemovalPolicy } from 'aws-cdk-lib'
import { Vpc } from 'aws-cdk-lib/aws-ec2'
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Construct } from 'constructs'
import { COMPANY_NAME } from '../config/environments'

export interface ServiceStackProps extends StackProps {
  vpcName: string
}

export class ServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props)
    Tags.of(this).add('company', COMPANY_NAME)

    const account = Stack.of(this).account
    const region = Stack.of(this).region

    const vpc = Vpc.fromLookup(this, 'vpc', {
      vpcName: props.vpcName,
    })

    const subnets = vpc.selectSubnets({ subnetGroupName: 'Public' })

    const alb = new ApplicationLoadBalancer(this, 'alb', {
      vpc: vpc,
      internetFacing: true,
      vpcSubnets: subnets,
    })

  }
}
