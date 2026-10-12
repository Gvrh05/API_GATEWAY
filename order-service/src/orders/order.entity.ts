import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

@Entity('orders')
export class Order {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'ID del cliente (coherente con customer-service)' })
  @Column({ type: 'int' })
  customerId: number;

  @ApiProperty({
    example: [{ productId: 1, quantity: 2, unitPrice: 1299.99 }],
    description: 'Items del pedido',
  })
  @Column({ type: 'jsonb' })
  items: OrderItem[];

  @ApiProperty({ example: 2599.98 })
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'PAID', 'CANCELLED'] })
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: OrderStatus;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
