import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { BadRequestException, ForbiddenException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus } from '@angaly/types';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { CreateOrderFromCartUseCase } from '../../application/use-cases/create-order-from-cart.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { ListCustomerOrdersUseCase } from '../../application/use-cases/list-customer-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { OrdersController } from '../../presentation/controllers/orders.controller';

function sampleOrder(overrides: Partial<{ status: OrderStatus; customerId: string }> = {}): Order {
  return new Order(
    'order-1',
    'ANG-2026-0001',
    overrides.customerId ?? 'customer-1',
    overrides.status ?? OrderStatus.PENDING,
    100,
    0,
    100,
    'MGA',
    null,
    new Date('2026-01-01T00:00:00.000Z'),
    new Date('2026-01-01T00:00:00.000Z'),
    [new OrderItem('item-1', 'order-1', 'variant-1', 2, 50)],
  );
}

describe('OrdersController (integration)', () => {
  let app: INestApplication;
  const createOrderUseCase = { execute: jest.fn() };
  const getOrderUseCase = { execute: jest.fn() };
  const listCustomerOrdersUseCase = { execute: jest.fn() };
  const updateOrderStatusUseCase = { execute: jest.fn() };
  const cancelOrderUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: CreateOrderFromCartUseCase, useValue: createOrderUseCase },
        { provide: GetOrderUseCase, useValue: getOrderUseCase },
        { provide: ListCustomerOrdersUseCase, useValue: listCustomerOrdersUseCase },
        { provide: UpdateOrderStatusUseCase, useValue: updateOrderStatusUseCase },
        { provide: CancelOrderUseCase, useValue: cancelOrderUseCase },
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

  describe('POST /orders', () => {
    it('rejects without a bearer token (401)', async () => {
      await request(server()).post('/orders').send({ items: [{ productVariantId: 'variant-1', quantity: 1 }] }).expect(401);
    });

    it('creates the order for the authenticated CLIENT (201)', async () => {
      createOrderUseCase.execute.mockResolvedValue(sampleOrder());

      const [header, value] = bearerFor('CLIENT');
      const response = await request(server())
        .post('/orders')
        .set(header, value)
        .send({ items: [{ productVariantId: 'variant-1', quantity: 2 }] })
        .expect(201);

      expect((response.body as { orderNumber: string }).orderNumber).toBe('ANG-2026-0001');
      expect(createOrderUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', items: [{ productVariantId: 'variant-1', quantity: 2 }] }),
      );
    });

    it('rejects an empty items array (400)', async () => {
      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/orders').set(header, value).send({ items: [] }).expect(400);
    });

    it('rejects a missing items field (400)', async () => {
      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/orders').set(header, value).send({}).expect(400);
    });

    it('propagates a 400 from insufficient stock', async () => {
      createOrderUseCase.execute.mockRejectedValue(new BadRequestException('Not enough stock for variant variant-1'));

      const [header, value] = bearerFor('CLIENT');
      await request(server())
        .post('/orders')
        .set(header, value)
        .send({ items: [{ productVariantId: 'variant-1', quantity: 99 }] })
        .expect(400);
    });
  });

  describe('GET /orders/:id', () => {
    it('returns the order to its owner (200)', async () => {
      getOrderUseCase.execute.mockResolvedValue(sampleOrder());

      const [header, value] = bearerFor('CLIENT');
      const response = await request(server()).get('/orders/order-1').set(header, value).expect(200);

      expect((response.body as { id: string }).id).toBe('order-1');
    });

    it('returns 403 for another customer’s order', async () => {
      getOrderUseCase.execute.mockRejectedValue(new ForbiddenException('This order does not belong to the current user'));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).get('/orders/order-1').set(header, value).expect(403);
    });

    it('returns 404 for an unknown order', async () => {
      getOrderUseCase.execute.mockRejectedValue(new NotFoundException('Order order-1 not found'));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).get('/orders/order-1').set(header, value).expect(404);
    });
  });

  describe('GET /orders', () => {
    it('lists the caller’s orders (200)', async () => {
      listCustomerOrdersUseCase.execute.mockResolvedValue([sampleOrder()]);

      const [header, value] = bearerFor('CLIENT');
      const response = await request(server()).get('/orders').set(header, value).expect(200);

      expect(response.body as unknown[]).toHaveLength(1);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('rejects a CLIENT caller (403)', async () => {
      const [header, value] = bearerFor('CLIENT');
      await request(server()).patch('/orders/order-1/status').set(header, value).send({ status: OrderStatus.CONFIRMED }).expect(403);
      expect(updateOrderStatusUseCase.execute).not.toHaveBeenCalled();
    });

    it('allows a MANAGER caller (200)', async () => {
      updateOrderStatusUseCase.execute.mockResolvedValue(sampleOrder({ status: OrderStatus.CONFIRMED }));

      const [header, value] = bearerFor('MANAGER');
      const response = await request(server())
        .patch('/orders/order-1/status')
        .set(header, value)
        .send({ status: OrderStatus.CONFIRMED })
        .expect(200);

      expect((response.body as { status: OrderStatus }).status).toBe(OrderStatus.CONFIRMED);
    });

    it('rejects an invalid status value (400)', async () => {
      const [header, value] = bearerFor('ADMIN');
      await request(server()).patch('/orders/order-1/status').set(header, value).send({ status: 'NOT_A_STATUS' }).expect(400);
    });

    it('propagates a 400 for an illegal transition', async () => {
      updateOrderStatusUseCase.execute.mockRejectedValue(new BadRequestException('Invalid order status transition from PENDING to DELIVERED'));

      const [header, value] = bearerFor('ADMIN');
      await request(server()).patch('/orders/order-1/status').set(header, value).send({ status: OrderStatus.DELIVERED }).expect(400);
    });
  });

  describe('POST /orders/:id/cancel', () => {
    it('cancels the caller’s own order (200)', async () => {
      cancelOrderUseCase.execute.mockResolvedValue(sampleOrder({ status: OrderStatus.CANCELLED }));

      const [header, value] = bearerFor('CLIENT');
      const response = await request(server()).post('/orders/order-1/cancel').set(header, value).expect(200);

      expect((response.body as { status: OrderStatus }).status).toBe(OrderStatus.CANCELLED);
    });

    it('returns 403 for another customer’s order', async () => {
      cancelOrderUseCase.execute.mockRejectedValue(new ForbiddenException('This order does not belong to the current user'));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/orders/order-1/cancel').set(header, value).expect(403);
    });
  });
});
