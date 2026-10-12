import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { OrderStatus } from '../order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'PAID', enum: ['PENDING', 'PAID', 'CANCELLED'] })
  @IsIn(['PENDING', 'PAID', 'CANCELLED'])
  status: OrderStatus;
}
