import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

// CORS configurado para grupogipfel.com
  app.enableCors({
    origin: [
      'https://www.grupogipfel.com',
      'https://grupogipfel.com',
      'http://www.grupogipfel.com',
      'http://localhost:3000',
      'http://localhost:5500',
      /\.grupogipfel\.com$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
   .setTitle('Gipfel IT API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Gipfel IT API corriendo en: http://localhost:${port}/api/v1`);
}
bootstrap();


