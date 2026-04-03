import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000').split(','),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Prisma shutdown hook
  await prismaService.enableShutdownHooks(app);

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Sintara CRM API')
      .setDescription('API документация для Sintara CRM')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Авторизация и аутентификация')
      .addTag('users', 'Управление пользователями')
      .addTag('contacts', 'Управление контактами')
      .addTag('companies', 'Управление компаниями')
      .addTag('deals', 'Управление сделками')
      .addTag('tasks', 'Управление задачами')
      .addTag('messages', 'Омниканальные сообщения')
      .addTag('analytics', 'Аналитика и отчеты')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log(`Sintara CRM Backend running on port ${port}`);
  console.log(`API docs: http://localhost:${port}/api/docs`);
}

bootstrap();
