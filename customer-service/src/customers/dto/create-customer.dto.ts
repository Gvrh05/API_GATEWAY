import { IsString, IsNotEmpty, MaxLength, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ana Torres' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'ana.torres@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+51 999 111 222' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;
}
