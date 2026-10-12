import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop Pro 14' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Laptop con 16GB RAM' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1299.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 25 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;
}
