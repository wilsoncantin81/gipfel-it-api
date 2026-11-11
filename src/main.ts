import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ENABLE CORS FIRST - Before anything else
  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
    credentials: false,
    maxAge: 3600
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Gipfel IT API')
    .setDescription('API para Gipfel IT Manager')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Servir el frontend en la raíz (antes del prefix /api/v1)
  const express = require('express');
  const path = require('path');
  app.use(express.static(path.join(process.cwd(), 'public')));

  await app.listen(3001);
  console.log('🚀 Gipfel IT API corriendo en: http://localhost:3001/api/v1');
}

bootstrap();
