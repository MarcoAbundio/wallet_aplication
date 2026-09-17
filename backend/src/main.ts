import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') ?? 'api';
  const corsOrigin = configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';

  // --- Security -------------------------------------------------------
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  });

  // --- Global setup -----------------------------------------------------
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // --- Swagger / OpenAPI documentation ----------------------------------
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cartera API')
    .setDescription(
      'REST API for Cartera, a lending platform that manages system users, clients, ' +
        'loans, installments and payments. All endpoints except /auth/login require a ' +
        'valid bearer access token.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter the access token returned by /auth/login',
        in: 'header',
      },
      'access-token',
    )
    .addTag('auth', 'Authentication and session management')
    .addTag('users', 'System user administration (staff accounts)')
    .addTag('clients', 'Borrower / client records')
    .addTag('loans', 'Loan origination and lifecycle')
    .addTag('payments', 'Payments and deposits against loans')
    .addTag('dashboard', 'Aggregated reports and statistics')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Cartera API running on http://localhost:${port}/${apiPrefix}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs available on http://localhost:${port}/docs`);
}

bootstrap();
