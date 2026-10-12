import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Order } from './order.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule implements OnModuleInit {
  constructor(
    private readonly service: OrdersService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.config.get<boolean>('SEED_ON_START')) {
      await this.service.seedIfEmpty();
    }
  }
}
