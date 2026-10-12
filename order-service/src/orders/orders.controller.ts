import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './order.entity';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos' })
  @ApiResponse({ status: 200, type: [Order] })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pedido por id' })
  @ApiResponse({ status: 200, type: Order })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear pedido (total se calcula en servidor)' })
  @ApiResponse({ status: 201, type: Order })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado del pedido' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
