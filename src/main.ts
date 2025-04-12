import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:8080', // Your Vue.js development server
      'http://localhost:3000', // In case you need local development
      // Add your production frontend URL when you deploy it
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Texture Generation API')
    .setDescription('API documentation for the Texture Generation service')
    .setVersion('1.0')
    .addSecurityRequirements('bearer')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Please enter token in format: Bearer <JWT>',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      authAction: {
        bearer: {
          name: 'bearer',
          schema: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'Please enter token in format: Bearer <JWT>',
          },
          value: '',
        },
      },
    },
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Listening on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
