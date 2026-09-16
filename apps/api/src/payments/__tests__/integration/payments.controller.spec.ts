import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { BadRequestException, ForbiddenException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PaymentMethod, PaymentStatus } from '@angaly/types';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Payment } from '../../domain/entities/payment.entity';
import { ConfirmPaymentUseCase } from '../../application/use-cases/confirm-payment.use-case';
import { GetPaymentStatusUseCase } from '../../application/use-cases/get-payment-status.use-case';
import { InitiatePaymentUseCase } from '../../application/use-cases/initiate-payment.use-case';
import { ListCustomerPaymentsUseCase } from '../../application/use-cases/list-customer-payments.use-case';
import { RefundPaymentUseCase } from '../../application/use-cases/refund-payment.use-case';
import { PaymentsController } from '../../presentation/controllers/payments.controller';

function samplePayment(overrides: Partial<{ status: PaymentStatus }> = {}): Payment {
  return new Payment('payment-1', 'order-1', PaymentMethod.CARD, overrides.status ?? PaymentStatus.PENDING, 1000, 'txn-1', null, new Date('2026-01-01T00:00:00.000Z'));
}

describe('PaymentsController (integration)', () => {
  let app: INestApplication;
  const initiatePaymentUseCase = { execute: jest.fn() };
  const confirmPaymentUseCase = { execute: jest.fn() };
  const getPaymentStatusUseCase = { execute: jest.fn() };
  const refundPaymentUseCase = { execute: jest.fn() };
  const listCustomerPaymentsUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: InitiatePaymentUseCase, useValue: initiatePaymentUseCase },
        { provide: ConfirmPaymentUseCase, useValue: confirmPaymentUseCase },
        { provide: GetPaymentStatusUseCase, useValue: getPaymentStatusUseCase },
        { provide: RefundPaymentUseCase, useValue: refundPaymentUseCase },
        { provide: ListCustomerPaymentsUseCase, useValue: listCustomerPaymentsUseCase },
        JwtAuthGuard,
        RolesGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  function bearerFor(role: 'CLIENT' | 'MANAGER' | 'ADMIN' = 'CLIENT', sub = 'user-1'): [string, string] {
    accessTokenService.verify.mockReturnValue({ sub, role });
    return ['Authorization', 'Bearer valid-token'];
  }

  describe('POST /payments', () => {
    it('rejects without a bearer token (401)', async () => {
      await request(server()).post('/payments').send({ orderId: 'order-1', method: PaymentMethod.CARD }).expect(401);
    });

    it('initiates a payment for the authenticated CLIENT (201)', async () => {
      initiatePaymentUseCase.execute.mockResolvedValue(samplePayment());

      const [header, value] = bearerFor('CLIENT');
      const response = await request(server()).post('/payments').set(header, value).send({ orderId: 'order-1', method: PaymentMethod.CARD }).expect(201);

      expect((response.body as { id: string }).id).toBe('payment-1');
      expect(initiatePaymentUseCase.execute).toHaveBeenCalledWith({ userId: 'user-1', orderId: 'order-1', method: PaymentMethod.CARD });
    });

    it('rejects a missing method (400)', async () => {
      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/payments').set(header, value).send({ orderId: 'order-1' }).expect(400);
    });

    it('propagates a 403 when the order does not belong to the caller', async () => {
      initiatePaymentUseCase.execute.mockRejectedValue(new ForbiddenException('This order does not belong to the current user'));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/payments').set(header, value).send({ orderId: 'order-1', method: PaymentMethod.CARD }).expect(403);
    });
  });

  describe('GET /payments', () => {
    it('rejects without a bearer token (401)', async () => {
      await request(server()).get('/payments').expect(401);
    });

    it("returns the caller's own payments for a CLIENT", async () => {
      listCustomerPaymentsUseCase.execute.mockResolvedValue([samplePayment()]);

      const [header, value] = bearerFor('CLIENT');
      const response = await request(server()).get('/payments').set(header, value).expect(200);

      const body = response.body as Array<{ id: string }>;
      expect(body).toHaveLength(1);
      expect(listCustomerPaymentsUseCase.execute).toHaveBeenCalledWith('user-1', 'CLIENT');
    });
  });

  describe('GET /payments/:id', () => {
    it('returns the payment to its owner (200)', async () => {
      getPaymentStatusUseCase.execute.mockResolvedValue(samplePayment());

      const [header, value] = bearerFor('CLIENT');
      await request(server()).get('/payments/payment-1').set(header, value).expect(200);
    });

    it('returns 404 for an unknown payment', async () => {
      getPaymentStatusUseCase.execute.mockRejectedValue(new NotFoundException('Payment payment-1 not found'));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).get('/payments/payment-1').set(header, value).expect(404);
    });
  });

  describe('PATCH /payments/:id/confirm', () => {
    it('rejects a CLIENT caller (403)', async () => {
      const [header, value] = bearerFor('CLIENT');
      await request(server()).patch('/payments/payment-1/confirm').set(header, value).expect(403);
      expect(confirmPaymentUseCase.execute).not.toHaveBeenCalled();
    });

    it('allows a MANAGER caller (200)', async () => {
      confirmPaymentUseCase.execute.mockResolvedValue(undefined);

      const [header, value] = bearerFor('MANAGER');
      await request(server()).patch('/payments/payment-1/confirm').set(header, value).expect(200);
    });

    it('propagates a 400 for an illegal order transition', async () => {
      confirmPaymentUseCase.execute.mockRejectedValue(new BadRequestException('Invalid order status transition from CANCELLED to PAID'));

      const [header, value] = bearerFor('ADMIN');
      await request(server()).patch('/payments/payment-1/confirm').set(header, value).expect(400);
    });
  });

  describe('POST /payments/:id/refund', () => {
    it('rejects a CLIENT caller (403)', async () => {
      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/payments/payment-1/refund').set(header, value).expect(403);
    });

    it('allows an ADMIN caller (200)', async () => {
      refundPaymentUseCase.execute.mockResolvedValue(samplePayment({ status: PaymentStatus.REFUNDED }));

      const [header, value] = bearerFor('ADMIN');
      const response = await request(server()).post('/payments/payment-1/refund').set(header, value).expect(200);

      expect((response.body as { status: PaymentStatus }).status).toBe(PaymentStatus.REFUNDED);
    });
  });
});
