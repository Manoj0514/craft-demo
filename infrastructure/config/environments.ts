import * as AppConfig from '../../app-config.json'

// Retrieve company and app details from app-config.json
export const COMPANY_NAME = AppConfig.company
export const APP_NAME = AppConfig.app
export const PLATFORM_VERSION = AppConfig.platformVersion

// target AWS regions for CI/CD and service stack deployment
export const TargetRegions = ['us-east-2']

//  AWS accounts for service stack deployment
export const SDLCAccounts = [
  { 
    name: 'manojpersonal',             
    id: '202533520954',                
    stage: 'dev'                       
  },
]