Welcome to Serverless with AWS Lambda Workshop by Skooldio 
==============================================

This sample code helps you learn how to build and deploy applications to AWS Lambda using AWS Cloudformation by providing
* A simple Express.js web service to index and search faces by calling AWS Rekoginition service
* A Lambda function triggered by S3 file upload to analyze facial image by calling AWS Rekoginition service

## Prerequisite

* AWS CLI
> Append an option `--profile yourprofile` for all commands to use a particular profile in your credential file

## Create a new Face collection
We will need to create a new face colleciton named `skooldio` in Rekognition service. Run a command
```shell
$ aws rekognition create-collection --collection-id skooldio
```

## Run locally
We will need an S3 bucket to store face images. 

> By default, AWS SDK will use AWS credentials from your AWS CLI. You can set `AWS_PROFILE` env variable to use a particular profile in your credential

```shell
$ npm install
$ node api/local.js
```

Use postman collection and env files in `/postman` to test your API.

## Workshop: API
The js code for API is in `/api`
* Create a Lambda handler for Express.js by using a lib [aws-serverless-express](https://github.com/awslabs/aws-serverless-express).
  * Put the handler in a file ```api/lambda.js``` 
* Modify `template.yml` by adding a Lambda function and S3 resources. We can pass S3 bucket name as an env variable to function. For references, see
  * https://github.com/awslabs/serverless-application-model
    * [SAM API backend example](https://github.com/awslabs/serverless-application-model/blob/master/examples/2016-10-31/api_backend/template.yaml)
    * [SAM Template Specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md)
  * You will need to give appropriate permissions to your Lambda to interact with other AWS resources by specifying policies. See [Lambda Managed Policies](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html) and [SAM Policy templates](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-policy-templates.html). You will at least need `AWSLambdaBasicExecutionRole` so your Lambda can upload logs to CloudWatch.
* Deploy using commands in [section](#deploy-using-aws-cloudformation) below. Once your stack has been created, find your endpoint of API Gateway in the AWS Console to start testing your API.

## Workshop: S3
The js code for S3 event processing is in `/s3`
* Modify `template.yml` by adding a new Lambda function resource is triggered by S3 upload event. See example [template](https://github.com/awslabs/serverless-application-model/blob/master/examples/apps/s3-get-object/template.yaml)

## Deploy using AWS Cloudformation
First, you will need an S3 bucket for AWS Cloudformation to upload your code for deployment. To create a bucket, run following command with your own unique bucket name.
```shell
$ aws s3 mb s3://{your-code-bucket}
```

Then run following commands to package and deploy your CloudFormation stack. Replace `{some-bucket}` and `{stack-name}` with proper name.

```shell
$ aws cloudformation package \
         --template-file template.yml \
         --output-template-file template-export.yml \
         --s3-bucket {your-code-bucket}

$ aws cloudformation deploy \
         --template-file template-export.yml \
         --capabilities CAPABILITY_IAM \
         --stack-name {stack-name}
```
The template should also create an S3 bucket for you and pass a bucket name an env variable to your Lambda functions.

## Delete all resources
After finishing the workshop, you can delete all the resources using following commands
```shell
$ aws rekognition delete-collection --collection-id skooldio
$ aws cloudformation delete-stack --stack-name {stack-name}
$ aws s3 rb s3://{your-code-bucket}
```