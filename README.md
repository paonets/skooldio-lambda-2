Welcome to Serverless with AWS Lambda Workshop by Skooldio 
==============================================

This sample code helps you learn how to build and deploy applications to AWS Lambda using AWS Cloudformation by providing
* A simple Express.js web service to index and search faces by calling AWS Rekoginition service
* A Lambda function triggered by S3 file upload to analyze facial image by calling AWS Rekoginition service

## Prerequisite

* AWS CLI
If you want to use a particular AWS CLI credential profile. Run following command to set it as default profile for this workshop. 
```shell
Windows
C:\> setx AWS_DEFAULT_PROFILE yourprofile

Mac
$ export AWS_DEFAULT_PROFILE=yourprofile
``` 

## Create a new Face collection
We will need to create a new face colleciton named `skooldio` in Rekognition service. Run a command
```shell
$ aws rekognition create-collection --collection-id skooldio
```

## Clone git repo
* Fork this repo to your account
* Run ```git clone <your git URL>``` to clone your repo to local.

## Run locally
* By default, AWS SDK for Javascript will use credentials from your AWS CLI. You can set `AWS_PROFILE` env variable to use a particular profile in your credential.
```shell
Windows
C:\> setx AWS_PROFILE yourprofile

Mac
$ export AWS_PROFILE=yourprofile
``` 
* Create S3 bucket to store face image. You will need to uncheck "Block all public access" and add following CORS configuation in Permissions tab.
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
<CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
</CORSRule>
</CORSConfiguration>
```
* Change default S3 bucket config in ```api/app.js``` accordingly.
* Run following commands to start Express.js server on http://localhost:3001
```shell
$ npm install
$ node api/local.js
```
* Open ```client/index.html``` to test your API through web client. By default, it will connect to your API on localhost. 

## Workshop 1 - API
* Create a Lambda handler for Express.js by using a lib [aws-serverless-express](https://github.com/awslabs/aws-serverless-express).
  * Put the handler in a file ```api/lambda.js``` 
* Modify `template.yml` by adding a Lambda function and S3 resources. We can pass S3 bucket name as an env variable to function. For references, see
  * https://github.com/awslabs/serverless-application-model
    * [SAM API backend example](https://github.com/awslabs/serverless-application-model/blob/master/examples/2016-10-31/api_backend/template.yaml)
    * [SAM Template Specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md)
  * You will need to give appropriate permissions to your Lambda to interact with other AWS resources by specifying policies. See [Lambda Managed Policies](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html) and [SAM Policy templates](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-policy-templates.html). You will at least need `AWSLambdaBasicExecutionRole` so your Lambda can upload logs to CloudWatch.
* Deploy using commands in [section](#deploy-using-aws-cloudformation) below. Once your stack has been created, find your endpoint of API Gateway in the AWS Console to start testing your API.
* Clean up your Rekognition collection before testing since it might contain images in your old bucket.
```
$ aws rekognition delete-collection --collection-id skooldio
$ aws rekognition create-collection --collection-id skooldio
```
* Update ```API_HOST``` in ```client/client.js``` and use ```client/index.html``` to test your API.

## Workshop 2 - S3 trigger
The js code for S3 event processing is in `/s3`
* Create a Lambda handler `s3/handler.js` and modify `template.yml` based on [example](https://github.com/awslabs/serverless-application-model/tree/develop/examples/2016-10-31/s3_processor)

## Workshop 3 - Lambda destinations
* Modify `template.yml` to include Lambda event config and destinations based on [example](https://github.com/awslabs/serverless-application-model/tree/develop/examples/2016-10-31/function_lambda_event_destinations)

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
After finishing the workshop, you can delete all the resources using following commands. But before deleting CloudFormation stack, you need to empty s3 buckets created by CloudFormation first.
```shell
$ aws rekognition delete-collection --collection-id skooldio
$ aws cloudformation delete-stack --stack-name {stack-name}
$ aws s3 rb s3://{your-code-bucket}
```