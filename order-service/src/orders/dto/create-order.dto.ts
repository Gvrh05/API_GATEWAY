import {
  IsInt,
  IsNotEmpty,
  Min,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1299.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
