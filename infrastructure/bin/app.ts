#!/usr/bin/env node
import { Tags } from 'aws-cdk-lib'

import 'source-map-support/register'
import { App, Stage, StageProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { PrereqsStack } from '../lib/PrereqsStack'
import { ServiceStack } from '../lib/ServiceStack'
import { VpcStack } from '../lib/VpcStack'
import { APP_NAME, SDLCAccounts, TargetRegions, COMPANY_NAME, IMAGE_TAG } from '../config/environments'

const app = new App()

class TaggedStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props)
    Tags.of(this).add('company', COMPANY_NAME)
    Tags.of(this).add('service', APP_NAME)
  }
}

interface DeploymentStageProps extends StageProps {
  stage: string
}

interface EnvironmentStageProps extends StageProps {
  stage: string
}

const vpcName = 'craft-demo'
class PrereqsStage extends TaggedStage {
  constructor(scope: Construct, id: string, props: EnvironmentStageProps) {
    super(scope, id, props)
    const prereqsStack = new PrereqsStack(this, 'Vpc', { stackName: `${COMPANY_NAME}-${APP_NAME}-vpc`, vpcName: vpcName })
  }
}

// Define per-environment deployment stages
class DeploymentStage extends TaggedStage {
  constructor(scope: Construct, id: string, props: DeploymentStageProps) {
    super(scope, id, props)
    const serviceStack = new ServiceStack(this, 'App', {
      stackName: `${COMPANY_NAME}-${APP_NAME}-service`,
      vpcName,
    })
  }
}

class EnvironmentStage extends TaggedStage {
  constructor(scope: Construct, id: string, props: EnvironmentStageProps) {
    super(scope, id, props)
    new PrereqsStage(this, 'prereqs', props)
    new DeploymentStage(this, 'app', {
      env: props.env,
      stage: props.stage,
    })
  }
}

SDLCAccounts.forEach(account =>
  TargetRegions.forEach(
    region =>
      new EnvironmentStage(app, `${account.stage}-${region}`, {
        env: { account: account.id, region },
        stage: account.stage,
      })
  )
)
