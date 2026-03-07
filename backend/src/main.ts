import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // More permissive CORS for deployment
  app.enableCors({
    origin: true, // Reflects the origin of the request
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Restore payload limits for bulk imports
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
