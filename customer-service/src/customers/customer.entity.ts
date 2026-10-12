import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('customers')
export class Customer {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Ana Torres' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ example: 'ana.torres@example.com' })
  @Column({ length: 200, unique: true })
  email: string;

  @ApiProperty({ example: '+51 999 111 222', required: false })
  @Column({ length: 50, nullable: true })
  phone: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
