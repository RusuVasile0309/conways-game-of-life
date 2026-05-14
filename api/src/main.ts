import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env['CORS_ORIGIN']?.split(',').map((s) => s.trim()) ?? ['http://localhost:3000'];
  app.enableCors({ origin: corsOrigin });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  const port = process.env.PORT ?? 3333;
  await app.listen(port);
  Logger.log(`🚀 API running on: http://localhost:${port}`);
}

bootstrap();
