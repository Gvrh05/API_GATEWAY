import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const logger = new Logger('OrderService');

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  const config = new DocumentBuilder()
    .setTitle('Order Service')
    .setDescription('API de pedidos (detrás de Kong API Gateway)')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port);
  logger.log(`Order service listening on port ${port}`);
}
bootstrap();
