import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { CreateOrderRequestDto } from '../../application/dtos/create-order-request.dto';
import { OrderResponseDto } from '../../application/dtos/order-response.dto';
import { UpdateOrderStatusRequestDto } from '../../application/dtos/update-order-status-request.dto';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { CreateOrderFromCartUseCase } from '../../application/use-cases/create-order-from-cart.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { ListCustomerOrdersUseCase } from '../../application/use-cases/list-customer-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { OrderMapper } from '../../infrastructure/mappers/order.mapper';

/** All routes require an authenticated user — `CLIENT` sees/manages their own orders, `MANAGER`/`ADMIN` see and transition every order. */
@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderFromCartUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly listCustomerOrdersUseCase: ListCustomerOrdersUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an order from cart items — resolves price/stock server-side' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async createOrder(@CurrentUser() user: AccessTokenPayload, @Body() payload: CreateOrderRequestDto): Promise<OrderResponseDto> {
    const order = await this.createOrderUseCase.execute({
      userId: user.sub,
      items: payload.items,
      shippingAddressJson: payload.shippingAddressJson,
    });
    return OrderMapper.toResponseDto(order);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id (owner, or MANAGER/ADMIN)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async getOrder(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.getOrderUseCase.execute(id, user.sub, user.role);
    return OrderMapper.toResponseDto(order);
  }

  @Get()
  @ApiOperation({ summary: 'List orders — own orders for CLIENT, every order for MANAGER/ADMIN' })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  async listOrders(@CurrentUser() user: AccessTokenPayload): Promise<OrderResponseDto[]> {
    const orders = await this.listCustomerOrdersUseCase.execute(user.sub, user.role);
    return orders.map((order) => OrderMapper.toResponseDto(order));
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Staff: transition an order to a new status' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async updateStatus(@Param('id') id: string, @Body() payload: UpdateOrderStatusRequestDto): Promise<OrderResponseDto> {
    const order = await this.updateOrderStatusUseCase.execute(id, payload.status);
    return OrderMapper.toResponseDto(order);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order (owner only, PENDING/CONFIRMED only)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async cancelOrder(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.cancelOrderUseCase.execute(id, user.sub);
    return OrderMapper.toResponseDto(order);
  }
}
