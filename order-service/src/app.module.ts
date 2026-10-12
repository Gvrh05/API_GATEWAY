import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HealthController } from './health.controller';
import { LoggingInterceptor } from './common/logging.interceptor';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3002),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_SYNCHRONIZE: Joi.boolean().default(true),
        SEED_ON_START: Joi.boolean().default(true),
        VALIDATE_REFS: Joi.string().valid('true', 'false').default('false'),
        CUSTOMER_SERVICE_URL: Joi.string().uri().optional().allow(''),
        PRODUCT_SERVICE_URL: Joi.string().uri().optional().allow(''),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [Order],
        synchronize: config.get<boolean>('DB_SYNCHRONIZE'),
      }),
    }),
    OrdersModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }],
})
export class AppModule {}
