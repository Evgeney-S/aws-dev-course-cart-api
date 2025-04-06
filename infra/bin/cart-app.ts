#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AWSDevCourseCartStack } from '../lib/cart-stack';

const app = new cdk.App();
new AWSDevCourseCartStack(app, 'AWSDevCourseCartStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});
