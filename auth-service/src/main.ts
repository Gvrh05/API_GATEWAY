import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const logger = new Logger('AuthService');

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  const config = new DocumentBuilder()
    .setTitle('Auth Service (Kong companion)')
    .setDescription(
      'Emite JWT HS256 que Kong verifica. También agrega el health de los 3 servicios. Detrás de Kong: POST /auth/login es público, todo /api/** exige Bearer.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3004);
  await app.listen(port);
  logger.log(`Auth service listening on port ${port}`);
}
bootstrap();
