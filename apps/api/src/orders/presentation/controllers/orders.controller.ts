import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CreateOrderFromCartUseCase } from '../../application/use-cases/create-order-from-cart.use-case';
import { CreateOrderPayload } from '@angaly/types';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly createOrderUseCase: CreateOrderFromCartUseCase) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an order from cart items' })
  @ApiResponse({ status: 201, description: 'Order successfully created.' })
  async createOrder(@Req() req: any, @Body() payload: CreateOrderPayload) {
    const customerId = req.user.sub; // assuming JWT payload has 'sub' as customerId
    const order = await this.createOrderUseCase.execute({
      customerId,
      items: payload.items,
      shippingAddressJson: payload.shippingAddressJson,
    });
    
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
    };
  }
}
