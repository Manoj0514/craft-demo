# Flask App Demo

This repository contains the code for deploying AWS resources and a Python-based Flask application. It uses AWS resources for hosting the application and incorporates GitHub Actions for CI/CD processes.

## Project Structure

- **flaskapp/**: Contains the Flask application code (`app.py`).
- **infrastructure/**: Contains the AWS Cloud Development Kit (CDK) code for provisioning AWS resources.
- **.github/workflows/**: Contains GitHub Actions configurations for automating the build and deployment processes into multiple regions.

## Flask Application

The application is a Flask app located in the flaskapp directory. It is deployed to AWS and configured to run in an EC2 instance, listening on port 5000. The app now incorporates dynamic displays of its running availability zone and a toggle button to show the API key fetched from the AWS environment.

```html
<h1>Flask app is running in {az} availability zone.</h1>
<button onclick="toggleApiKey()">Show API Key</button>
<div id="api-key">API Key: {api_key}</div>
```

## AWS Infrastructure

The AWS resources are provisioned using the AWS CDK. The infrastructure is defined in TypeScript and includes:

- VPC with public and private subnets for deploying network resources.
- Security Groups: Configured to allow HTTP traffic and secure other network resources.
- Secrets Manager: Used to securely manage sensitive data such as API keys, with a dedicated secret for the Flask app.
- Elastic Load Balancer (ALB): Internet-facing load balancer, distributing traffic and integrating with AWS Route 53 for DNS management with a weighted routing policy.
- Auto Scaling Group: Automatically scales the number of EC2 instances based on traffic demand.
- EC2 Instances: Hosts the Flask application. Instances are launched with specific roles and instance profiles to allow access to AWS services like S3 and Secrets Manager.

### Key Infrastructure Components

- Load Balancer Configuration:
  - Public hosted zone for traffic routing with route weighting for efficient DNS resolution.

- User Data:
  - Dynamic configuration via AWS metadata service for region and availability zone.
  - Retrieval and execution of the Flask application from an S3 bucket.

- IAM Roles and Policies:
  - EC2 instance roles now accommodate robust permissions for Secrets Manager and S3 access.

Here's an extract detailing the EC2 configuration:

```typescript
const launchTemplate = new LaunchTemplate(this, 'LaunchTemplate', {
  machineImage: MachineImage.latestAmazonLinux2(),
  instanceType: new InstanceType('t3.micro'),
  securityGroup,
  role: instanceRole,
  userData,
  keyName: 'firstkey',
});
```

## GitHub Actions

GitHub Actions are used for CI/CD, streamlining the build and deployment of the application. The configurations include:

- Build and Deploy Workflow (.github/workflows/main.yml):
  - Runs on pushes to the main branch.
  - Builds the application and uploads necessary files to an S3 bucket.
  - Deploys the application using AWS CDK to ensure infrastructure is up-to-date.
  - Secrets Management Integration: Direct access and management of secrets through AWS Secrets Manager.

### Key Steps in Workflow

- Build:
  - Checkout the repository.
  - Configure AWS credentials using GitHub secrets.
  - Copy application files to an S3 bucket.

- **Deploy**:
  - Perform `cdk synth` to generate an AWS CloudFormation template.
  - Deploy the application stack to the AWS environment.

## Getting Started

To get started with setting up your environment, ensure you have the AWS CDK, Node.js, and Python installed on your system. Follow the guide to configure your local AWS credentials and secret keys.

### Setting Up AWS CDK
```bash
npm install -g aws-cdk
```

### Deploying with CDK
The deployment process is automated using the CDK scripts in the `infrastructure` directory.

```bash
cd infrastructure
npm install
cdk deploy
```

This will set up all the necessary AWS resources including EC2 instances, load balancers, and related networking components.

## Conclusion

This project demonstrates a comprehensive approach to building, deploying, and managing a Flask application using AWS services and GitHub Actions. It leverages modern cloud-native tools for seamless integration, scalability, and security.

