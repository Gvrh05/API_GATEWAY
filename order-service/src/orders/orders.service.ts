import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    private readonly config: ConfigService,
  ) {}

  findAll(): Promise<Order[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.repo.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }
    if (this.config.get<string>('VALIDATE_REFS') === 'true') {
      await this.validateRefs(dto.customerId, dto.items.map((i) => i.productId));
    }
    const total = dto.items.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
    const entity = this.repo.create({
      customerId: dto.customerId,
      items: dto.items,
      total: Math.round(total * 100) / 100,
      status: 'PENDING',
    });
    return this.repo.save(entity);
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    return this.repo.save(order);
  }

  /** Validación opcional y simple contra los otros servicios. */
  private async validateRefs(customerId: number, productIds: number[]): Promise<void> {
    const customerUrl = this.config.get<string>('CUSTOMER_SERVICE_URL');
    const productUrl = this.config.get<string>('PRODUCT_SERVICE_URL');
    try {
      if (customerUrl) {
        const r = await fetch(`${customerUrl}/customers/${customerId}`);
        if (!r.ok) throw new BadRequestException(`Customer ${customerId} not found`);
      }
      if (productUrl) {
        for (const pid of productIds) {
          const r = await fetch(`${productUrl}/products/${pid}`);
          if (!r.ok) throw new BadRequestException(`Product ${pid} not found`);
        }
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      // Si los servicios no responden, no bloqueamos (validación opcional)
    }
  }

  /** Seed determinista: 8 pedidos coherentes con los seeds de product/customer. */
  async seedIfEmpty(): Promise<void> {
    if ((await this.repo.count()) > 0) return;
    const mk = (
      id: number,
      customerId: number,
      items: Array<{ productId: number; quantity: number; unitPrice: number }>,
      status: OrderStatus,
    ) => ({
      id,
      customerId,
      items,
      total: Math.round(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) * 100) / 100,
      status,
    });
    await this.repo.save([
      mk(1, 1, [{ productId: 1, quantity: 1, unitPrice: 1299.99 }], 'PAID'),
      mk(2, 1, [{ productId: 2, quantity: 2, unitPrice: 29.9 }], 'PENDING'),
      mk(3, 2, [{ productId: 3, quantity: 1, unitPrice: 89.99 }, { productId: 5, quantity: 1, unitPrice: 59.5 }], 'PAID'),
      mk(4, 2, [{ productId: 4, quantity: 1, unitPrice: 449.0 }], 'CANCELLED'),
      mk(5, 3, [{ productId: 6, quantity: 2, unitPrice: 99.99 }], 'PENDING'),
      mk(6, 3, [{ productId: 7, quantity: 1, unitPrice: 64.0 }, { productId: 8, quantity: 1, unitPrice: 49.99 }], 'PAID'),
      mk(7, 4, [{ productId: 9, quantity: 1, unitPrice: 199.0 }], 'PENDING'),
      mk(8, 5, [{ productId: 10, quantity: 3, unitPrice: 39.99 }], 'PAID'),
    ]);
  }
}
