import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Product } from './product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule implements OnModuleInit {
  constructor(
    private readonly service: ProductsService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.config.get<boolean>('SEED_ON_START')) {
      await this.service.seedIfEmpty();
    }
  }
}
