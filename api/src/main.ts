import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required but not set');
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Security headers — disable CSP to avoid breaking API consumers / frontend assets
  app.use(helmet({ contentSecurityPolicy: false }));

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://p2ptax.smartlaunchhub.com'];
  app.enableCors({ origin: allowedOrigins });

  const port = process.env.PORT ?? 3812;
  await app.listen(port);
  console.log(`P2PTax API running on port ${port}`);
}

bootstrap();
