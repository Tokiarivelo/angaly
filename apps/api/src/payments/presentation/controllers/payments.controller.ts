import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InitiatePaymentUseCase } from '../../application/use-cases/initiate-payment.use-case';
import { ConfirmPaymentUseCase } from '../../application/use-cases/confirm-payment.use-case';
import { InitiatePaymentPayload } from '@angaly/types';

@ApiTags('Payments')
@Controller('api/payments')
export class PaymentsController {
  constructor(
    private readonly initiatePaymentUseCase: InitiatePaymentUseCase,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a new payment for an order' })
  async initiatePayment(@Body() payload: InitiatePaymentPayload) {
    const payment = await this.initiatePaymentUseCase.execute({
      orderId: payload.orderId,
      method: payload.method,
    });
    return {
      id: payment.id,
      status: payment.status,
      transactionRef: payment.transactionRef,
    };
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Manually confirm a payment (for mock/CASH_ON_DELIVERY)' })
  async confirmPayment(@Param('id') id: string) {
    await this.confirmPaymentUseCase.execute({ paymentId: id });
    return { success: true };
  }
}
