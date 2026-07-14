import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

async function bootstrap() {
      const app = await NestFactory.create(AppModule);

  // Middleware CORS personalizado - Debe estar antes de las rutas
  app.use((req: Request, res: Response, next: NextFunction) => {
          res.header('Access-Control-Allow-Origin', '*');
          res.header('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
          res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.header('Access-Control-Max-Age', '3600');

              if (req.method === 'OPTIONS') {
                        res.sendStatus(200);
              } else {
                        next();
              }
  });

  app.enableCors({
          origin: '*',
          credentials: false,
          methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization']
  });

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
        .setTitle('Gipfel IT API')
        .setDescription('API para Gipfel IT Manager')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);

  await app.listen(3001);
      console.log('🚀 Gipfel IT API corriendo en: http://localhost:3001/api/v1');
}

bootstrap();
