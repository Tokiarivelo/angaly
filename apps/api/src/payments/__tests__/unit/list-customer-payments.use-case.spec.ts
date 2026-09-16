import { PaymentMethod, PaymentStatus } from '@angaly/types';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { Payment } from '../../domain/entities/payment.entity';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository';
import { ListCustomerPaymentsUseCase } from '../../application/use-cases/list-customer-payments.use-case';

function samplePayment(id: string): Payment {
  return new Payment(id, `order-${id}`, PaymentMethod.CARD, PaymentStatus.PAID, 1000, 'txn-1', new Date(), new Date());
}

function buildPaymentRepository(): jest.Mocked<IPaymentRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByOrderId: jest.fn(),
    update: jest.fn(),
    findByCustomerId: jest.fn().mockResolvedValue([samplePayment('payment-1')]),
    findAll: jest.fn().mockResolvedValue([samplePayment('payment-1'), samplePayment('payment-2')]),
  };
}

function buildCustomerRepository(): jest.Mocked<ICustomerRepository> {
  const customer = CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn(), update: jest.fn() };
}

describe('ListCustomerPaymentsUseCase', () => {
  it('returns only the caller’s own payments for CLIENT', async () => {
    const paymentRepository = buildPaymentRepository();
    const useCase = new ListCustomerPaymentsUseCase(paymentRepository, buildCustomerRepository());

    const payments = await useCase.execute('user-1', 'CLIENT');

    expect(payments).toHaveLength(1);
    expect(paymentRepository.findByCustomerId).toHaveBeenCalledWith('customer-1');
    expect(paymentRepository.findAll).not.toHaveBeenCalled();
  });

  it('returns every payment for MANAGER', async () => {
    const paymentRepository = buildPaymentRepository();
    const useCase = new ListCustomerPaymentsUseCase(paymentRepository, buildCustomerRepository());

    const payments = await useCase.execute('staff-user', 'MANAGER');

    expect(payments).toHaveLength(2);
    expect(paymentRepository.findByCustomerId).not.toHaveBeenCalled();
  });

  it('returns every payment for ADMIN', async () => {
    const paymentRepository = buildPaymentRepository();
    const useCase = new ListCustomerPaymentsUseCase(paymentRepository, buildCustomerRepository());

    const payments = await useCase.execute('staff-user', 'ADMIN');

    expect(payments).toHaveLength(2);
  });
});
