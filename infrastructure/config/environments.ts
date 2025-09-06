import * as AppConfig from '../../app-config.json'
// import { DEV_AUTOSCALING_CONFIG } from './autoscaling'

export const COMPANY_NAME = AppConfig.company
export const APP_NAME = AppConfig.app
export const PLATFORM_VERSION = AppConfig.platformVersion

// This array controls the regions in which CI/CD and service stacks are deployed.
export const TargetRegions = ['us-east-2']

// This array controls the AWS accounts in which account your service stack is deployed.
export const SDLCAccounts = [
  { name: 'manojpersonal', id: '202533520954', privateDnsZoneName: 'universe.com', stage: 'dev' },
]