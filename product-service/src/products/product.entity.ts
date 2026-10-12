import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('products')
export class Product {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Laptop Pro 14' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ example: 'Laptop con 16GB RAM y SSD 512GB', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 1299.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: 25 })
  @Column({ type: 'int', default: 0 })
  stock: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
