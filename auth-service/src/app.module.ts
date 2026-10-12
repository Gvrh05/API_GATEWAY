import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { LoggingInterceptor } from './common/logging.interceptor';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3004),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRES_IN: Joi.string().default('1h'),
        AUTH_USERS: Joi.string().required(),
        JWT_ISS_ADMIN: Joi.string().default('admin-issuer'),
        JWT_ISS_USER: Joi.string().default('user-issuer'),
        PRODUCT_SERVICE_URL: Joi.string().uri().required(),
        ORDER_SERVICE_URL: Joi.string().uri().required(),
        CUSTOMER_SERVICE_URL: Joi.string().uri().required(),
      }),
    }),
    JwtModule.register({ global: true }),
    AuthModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }],
})
export class AppModule {}
