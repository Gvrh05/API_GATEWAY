import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Customer } from './customer.entity';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule implements OnModuleInit {
  constructor(
    private readonly service: CustomersService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.config.get<boolean>('SEED_ON_START')) {
      await this.service.seedIfEmpty();
    }
  }
}
