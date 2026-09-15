import type { Payment } from '../../domain/entities/payment.entity';
import { PaymentResponseDto } from '../../application/dtos/payment-response.dto';

export class PaymentMapper {
  static toResponseDto(payment: Payment): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = payment.id;
    dto.orderId = payment.orderId;
    dto.method = payment.method;
    dto.status = payment.status;
    dto.amount = payment.amount.toFixed(2);
    dto.transactionRef = payment.transactionRef;
    dto.paidAt = payment.paidAt ? payment.paidAt.toISOString() : null;
    dto.createdAt = payment.createdAt.toISOString();
    return dto;
  }
}
