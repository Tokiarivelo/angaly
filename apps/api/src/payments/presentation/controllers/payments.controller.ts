import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { InitiatePaymentRequestDto } from '../../application/dtos/initiate-payment-request.dto';
import { PaymentResponseDto } from '../../application/dtos/payment-response.dto';
import { ConfirmPaymentUseCase } from '../../application/use-cases/confirm-payment.use-case';
import { GetPaymentStatusUseCase } from '../../application/use-cases/get-payment-status.use-case';
import { InitiatePaymentUseCase } from '../../application/use-cases/initiate-payment.use-case';
import { ListCustomerPaymentsUseCase } from '../../application/use-cases/list-customer-payments.use-case';
import { RefundPaymentUseCase } from '../../application/use-cases/refund-payment.use-case';
import { PaymentMapper } from '../../infrastructure/mappers/payment.mapper';

/**
 * `initiate`/`get` are `CLIENT`-reachable (ownership enforced in their
 * use-case); `confirm`/`refund` are staff-only manual actions — see
 * docs/features/payments.md "Points d'attention": a real webhook path,
 * verified by provider signature rather than a user JWT, is still TODO.
 */
@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class PaymentsController {
  constructor(
    private readonly initiatePaymentUseCase: InitiatePaymentUseCase,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
    private readonly getPaymentStatusUseCase: GetPaymentStatusUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
    private readonly listCustomerPaymentsUseCase: ListCustomerPaymentsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a new payment for an order the caller owns' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  async initiatePayment(@CurrentUser() user: AccessTokenPayload, @Body() payload: InitiatePaymentRequestDto): Promise<PaymentResponseDto> {
    const payment = await this.initiatePaymentUseCase.execute({
      userId: user.sub,
      orderId: payload.orderId,
      method: payload.method,
    });
    return PaymentMapper.toResponseDto(payment);
  }

  @Get()
  @ApiOperation({ summary: "List payments — own (for the caller's orders) for CLIENT, every payment for MANAGER/ADMIN" })
  @ApiResponse({ status: 200, type: [PaymentResponseDto] })
  async listPayments(@CurrentUser() user: AccessTokenPayload): Promise<PaymentResponseDto[]> {
    const payments = await this.listCustomerPaymentsUseCase.execute(user.sub, user.role);
    return payments.map((payment) => PaymentMapper.toResponseDto(payment));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by id (owner of its order, or MANAGER/ADMIN)' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async getPayment(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.getPaymentStatusUseCase.execute(id, user.sub, user.role);
    return PaymentMapper.toResponseDto(payment);
  }

  @Patch(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Staff: manually confirm a payment (mock/CASH_ON_DELIVERY flow)' })
  @ApiResponse({ status: 200 })
  async confirmPayment(@Param('id') id: string): Promise<{ success: true }> {
    await this.confirmPaymentUseCase.execute({ paymentId: id });
    return { success: true };
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Staff: refund a PAID payment, transitioning its order to REFUNDED' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async refundPayment(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.refundPaymentUseCase.execute(id);
    return PaymentMapper.toResponseDto(payment);
  }
}
