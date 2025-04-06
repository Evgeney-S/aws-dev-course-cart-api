import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Context, Handler } from 'aws-lambda';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverlessExpress from '@vendia/serverless-express';

let serverlessExpressInstance: any;

async function bootstrap() {
  const expressApp = express();
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  
//   nestApp.enableCors();
  await nestApp.init();
  
  // Логирование маршрутов
  const server = nestApp.getHttpServer();
  const router = server._events.request._router;
  console.log('Routes:');
  router.stack.forEach((layer: any) => {
    if (layer.route) console.log(`${Object.keys(layer.route.methods)} ${layer.route.path}`);
  });
  
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event: any, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (!serverlessExpressInstance) {
    console.log('Cold start - bootstrapping application');
    serverlessExpressInstance = await bootstrap();
    console.log('Bootstrap complete');
  }
  
  console.log('Processing event:', JSON.stringify(event));
  return serverlessExpressInstance(event, context);
};
