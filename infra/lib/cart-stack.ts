import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export class AWSDevCourseCartStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Logs group for Lambda
        const logGroup = new logs.LogGroup(this, 'CartLambdaLogs', {
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Remove logs when stack is deleted
        });

        // Reference existing DynamoDB tables
        const productsTable = dynamodb.Table.fromTableName(
            this, 
            'ProductsTable', 
            'products'
        );

        // VPC settings
        const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
            vpcId: 'vpc-0f6f50027b89318bf', // By specified VPC ID
            // isDefault: true, // To use the default VPC
        });
        // Security group
        const cartLambdaSG = new ec2.SecurityGroup(this, 'CartLambdaSG', {
            vpc,
            description: 'Security group for Cart Lambda function',
            allowAllOutbound: true,
        });
        const dbSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
            this,
            'DBSecurityGroup',
            'sg-0cc0b059d81b33c60'
        );
        dbSecurityGroup.addIngressRule(
            cartLambdaSG,
            ec2.Port.tcp(5432),
            'Allow Cart Lambda access to PostgreSQL'
        );

        // Create Lambda function (NodejsFunction uses esbuild for bundling)
        const cartLambda = new NodejsFunction(this, 'CartLambdaFunction', {
            functionName: 'AWSDevCourseCartServiceStack-CartLambdaFunction',
            description: 'Cart API Lambda functon for AWS Developer course',
            entry: path.join(__dirname, '../../src/lambda.ts'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            // esbuild bundling settings
            bundling: {
                // minify: true,
                minify: false,
                sourceMap: true,
                externalModules: [
                    'aws-sdk',
                    '@nestjs/microservices',
                    '@nestjs/websockets',
                    '@nestjs/platform-socket.io',
                    'class-transformer',
                    'class-validator',
                    'cache-manager',
                    'class-transformer/storage',
                    'kafkajs',
                    'ioredis',
                    '@grpc/grpc-js',
                    '@grpc/proto-loader',
                ],
                environment: {
                    NODE_ENV: 'production',
                },
                forceDockerBundling: false,
                target: 'node20',
            },
            environment: {
                NODE_ENV: 'production',
                PRODUCTS_TABLE: productsTable.tableName,
                DB_USER: process.env.DB_USER ?? '',
                DB_PASSWORD: process.env.DB_PASSWORD ?? '',
                DB_HOST: process.env.DB_HOST ?? '',
                DB_PORT: process.env.DB_PORT ?? '',
                DB_DATABASE: process.env.DB_DATABASE ?? '',
            },
            logGroup,
            vpc: vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            allowPublicSubnet: true,
            securityGroups: [cartLambdaSG],
        });

        // Grant permissions to Lambda functions to access DynamoDB tables
        productsTable.grantReadData(cartLambda);
        // Add necessary permissions for the Lambda to access VPC
        cartLambda.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'ec2:CreateNetworkInterface',
                    'ec2:DescribeNetworkInterfaces',
                    'ec2:DeleteNetworkInterface',
                    'ec2:AssignPrivateIpAddresses',
                    'ec2:UnassignPrivateIpAddresses'
                ],
                resources: ['*'],
            })
        );

        // Add function URL
        const cartFnUrl = cartLambda.addFunctionUrl({
            authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedMethods: [cdk.aws_lambda.HttpMethod.ALL],
                allowedHeaders: ['*'],
            },
        });
        
        // Output Lambda URL
        new cdk.CfnOutput(this, 'CartLambdaArn', {
            value: cartFnUrl.url,
            description: 'Cart Lambda URL',
            exportName: 'CartLambdaFunctionUrl',
        });

        // We dont use API in this task, so just for notes
        // ---------------------------------------------------------------
        /*
        // IAM role with additional permissions if required (DynamoDB, S3, etc.)
        cartLambda.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    // 'dynamodb:GetItem',
                    // 'dynamodb:PutItem',
                    // 's3:GetObject',
                ],
                resources: [
                    // 'arn:aws:dynamodb:*:*:table/my-table',
                    // 'arn:aws:s3:::my-bucket/*',
                ],
            })
        );

        // Create API Gateway
        const api = new apigateway.RestApi(this, 'CartApi', {
            restApiName: 'Cart Lambda Service',
            description: 'AWS Developer course Cart API',
            deployOptions: {
                stageName: 'prod',
                // Logging
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true, // Log all requests and response
                metricsEnabled: true,   // CloudWatch metrics
            },
            // CORS
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Amz-Date',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                ],
                // maxAge: cdk.Duration.days(1),
            },
        });

        // Lambda and API Gateway integration
        const lambdaIntegration = new apigateway.LambdaIntegration(cartLambda, {
            proxy: true, // proxy all requests to Lambda without modification
            timeout: cdk.Duration.seconds(29), // less then Lambda
        });
    
        // Add a proxy resource that forwards all requests to Lambda
        // {proxy+} means that all paths will be passed to Lambda
        const proxyResource = api.root.addResource('{proxy+}');
        proxyResource.addMethod('ANY', lambdaIntegration);
        api.root.addMethod('ANY', lambdaIntegration);
    
        // API usage plan
        const plan = api.addUsagePlan('NestjsApiUsagePlan', {
            name: 'Standard',
            throttle: {
                rateLimit: 2,  // Requests per second
                burstLimit: 5, // Burst requests
            },
            quota: {
                limit: 100, // Total number of requests
                period: apigateway.Period.WEEK,
            },
        });
        
        plan.addApiStage({
            stage: api.deploymentStage,
        });
    
        // Output API Gateway URL
        new cdk.CfnOutput(this, 'CartApiUrl', {
            value: api.url,
            description: 'Cart API Gateway URL',
            exportName: 'CartApiUrl',
        });
        */
        // ---------------------------------------------------------------
        

    }
}
