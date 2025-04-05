import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'http';
import { Context, Handler } from 'aws-lambda';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';
import { ExpressAdapter } from '@nestjs/platform-express';
import express = require('express');
import { INestApplication } from '@nestjs/common';
import * as db from './db';


let cachedServer: Server;
let cachedApp: INestApplication;


// Create Express-app
async function bootstrapServer(): Promise<Server> {
    if (!cachedServer) {
        const expressApp = express();
        const adapter = new ExpressAdapter(expressApp);
        
        // Create NestJS application
        const app = await NestFactory.create(AppModule, adapter);
        
        // Enable CORS if needed
        app.enableCors();
        
        // Initialize the NestJS application
        await app.init();
        
        // Create server
        cachedServer = createServer(expressApp);
        cachedApp = app;
    }
    
    return cachedServer;
}



// Lambda handler
export const handler: Handler = async (event: any, context: Context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        if (!cachedServer) {
            console.log('Initializing Nest.js server');
            cachedServer = await bootstrapServer();
            console.log('Nest.js server initialized successfully');
        }
    
        // Handle the request
        const response = await proxy(cachedServer, event, context, 'PROMISE').promise;
        return response;

    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal Server Error',
                // error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
                error: error instanceof Error ? error.message : undefined
            })
        };
    } finally {
        if (db && typeof db.close === 'function') {
            await db.close();
        }
    }
};
