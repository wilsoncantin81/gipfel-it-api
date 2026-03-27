import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api/v1');
  const config = new DocumentBuilder().setTitle('Gipfel IT API').setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Gipfel IT API corriendo en: http://localhost:${port}/api/v1`);
  console.log(`📚 Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
