import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { BadRequestException, ConflictException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { CancelAppointmentUseCase } from '../../application/use-cases/cancel-appointment.use-case';
import { ConfirmAppointmentUseCase } from '../../application/use-cases/confirm-appointment.use-case';
import { CreateAppointmentUseCase } from '../../application/use-cases/create-appointment.use-case';
import { GetAppointmentByReferenceUseCase } from '../../application/use-cases/get-appointment-by-reference.use-case';
import { GetDaySlotsUseCase } from '../../application/use-cases/get-day-slots.use-case';
import { GetMonthAvailabilityUseCase } from '../../application/use-cases/get-month-availability.use-case';
import { AppointmentsController } from '../../presentation/controllers/appointments.controller';

function sampleAppointment(status: AppointmentEntity['status'] = 'PENDING'): AppointmentEntity {
  return AppointmentEntity.create({
    id: 'appointment-1',
    reference: 'ANG-RDV-2026-AbCdEfGh',
    customerId: null,
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: '+261 34 12 345 67',
    email: 'nirina@example.com',
    type: 'ESSAYAGE',
    atelierId: 'atelier-1',
    assignedToId: null,
    scheduledAt: new Date('2026-09-15T09:00:00.000Z'),
    durationMinutes: 45,
    status,
    message: null,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  });
}

describe('AppointmentsController (integration)', () => {
  let app: INestApplication;
  const getMonthAvailabilityUseCase = { execute: jest.fn() };
  const getDaySlotsUseCase = { execute: jest.fn() };
  const createAppointmentUseCase = { execute: jest.fn() };
  const getAppointmentByReferenceUseCase = { execute: jest.fn() };
  const cancelAppointmentUseCase = { execute: jest.fn() };
  const confirmAppointmentUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        { provide: GetMonthAvailabilityUseCase, useValue: getMonthAvailabilityUseCase },
        { provide: GetDaySlotsUseCase, useValue: getDaySlotsUseCase },
        { provide: CreateAppointmentUseCase, useValue: createAppointmentUseCase },
        { provide: GetAppointmentByReferenceUseCase, useValue: getAppointmentByReferenceUseCase },
        { provide: CancelAppointmentUseCase, useValue: cancelAppointmentUseCase },
        { provide: ConfirmAppointmentUseCase, useValue: confirmAppointmentUseCase },
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

  describe('GET /appointments/availability', () => {
    it('returns the month availability', async () => {
      getMonthAvailabilityUseCase.execute.mockResolvedValue([{ date: '2026-09-01', status: 'available' }]);

      const response = await request(server())
        .get('/appointments/availability')
        .query({ atelierId: 'atelier-1', month: '2026-09' })
        .expect(200);

      const body = response.body as Array<{ date: string; status: string }>;
      expect(body).toEqual([{ date: '2026-09-01', status: 'available' }]);
    });

    it('rejects a malformed month (400)', async () => {
      await request(server())
        .get('/appointments/availability')
        .query({ atelierId: 'atelier-1', month: 'not-a-month' })
        .expect(400);
    });
  });

  describe('GET /appointments/availability/slots', () => {
    it('returns the day slots', async () => {
      getDaySlotsUseCase.execute.mockResolvedValue([new Date('2026-09-01T09:00:00.000Z')]);

      const response = await request(server())
        .get('/appointments/availability/slots')
        .query({ atelierId: 'atelier-1', date: '2026-09-01' })
        .expect(200);

      const body = response.body as { slots: string[] };
      expect(body.slots).toEqual(['2026-09-01T09:00:00.000Z']);
    });
  });

  describe('POST /appointments', () => {
    it('creates an appointment for a signed-out visitor (no Authorization header)', async () => {
      createAppointmentUseCase.execute.mockResolvedValue(sampleAppointment());

      const response = await request(server())
        .post('/appointments')
        .send({
          firstName: 'Nirina',
          lastName: 'Rakoto',
          phone: '+261 34 12 345 67',
          email: 'nirina@example.com',
          type: 'ESSAYAGE',
          atelierId: 'atelier-1',
          scheduledAt: '2026-09-15T09:00:00.000Z',
        })
        .expect(201);

      const body = response.body as { reference: string };
      expect(body.reference).toBe('ANG-RDV-2026-AbCdEfGh');
      expect(createAppointmentUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
    });

    it('links the userId when a valid Bearer token is present', async () => {
      accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });
      createAppointmentUseCase.execute.mockResolvedValue(sampleAppointment());

      await request(server())
        .post('/appointments')
        .set('Authorization', 'Bearer valid-token')
        .send({
          firstName: 'Nirina',
          lastName: 'Rakoto',
          phone: '+261 34 12 345 67',
          email: 'nirina@example.com',
          type: 'ESSAYAGE',
          atelierId: 'atelier-1',
          scheduledAt: '2026-09-15T09:00:00.000Z',
        })
        .expect(201);

      expect(createAppointmentUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
    });

    it('ignores an invalid Bearer token rather than failing the public route', async () => {
      accessTokenService.verify.mockReturnValue(null);
      createAppointmentUseCase.execute.mockResolvedValue(sampleAppointment());

      await request(server())
        .post('/appointments')
        .set('Authorization', 'Bearer bad-token')
        .send({
          firstName: 'Nirina',
          lastName: 'Rakoto',
          phone: '+261 34 12 345 67',
          email: 'nirina@example.com',
          type: 'ESSAYAGE',
          atelierId: 'atelier-1',
          scheduledAt: '2026-09-15T09:00:00.000Z',
        })
        .expect(201);

      expect(createAppointmentUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
    });

    it('returns 409 when the slot was just booked', async () => {
      createAppointmentUseCase.execute.mockRejectedValue(new ConflictException());

      await request(server())
        .post('/appointments')
        .send({
          firstName: 'Nirina',
          lastName: 'Rakoto',
          phone: '+261 34 12 345 67',
          email: 'nirina@example.com',
          type: 'ESSAYAGE',
          atelierId: 'atelier-1',
          scheduledAt: '2026-09-15T09:00:00.000Z',
        })
        .expect(409);
    });
  });

  describe('GET /appointments/:reference', () => {
    it('returns the appointment', async () => {
      getAppointmentByReferenceUseCase.execute.mockResolvedValue(sampleAppointment());

      await request(server()).get('/appointments/ANG-RDV-2026-AbCdEfGh').expect(200);
    });

    it('returns 404 for an unknown reference', async () => {
      getAppointmentByReferenceUseCase.execute.mockRejectedValue(new NotFoundException());

      await request(server()).get('/appointments/missing').expect(404);
    });
  });

  describe('POST /appointments/:reference/cancel', () => {
    it('cancels without requiring authentication', async () => {
      cancelAppointmentUseCase.execute.mockResolvedValue(sampleAppointment('CANCELLED'));

      await request(server()).post('/appointments/ANG-RDV-2026-AbCdEfGh/cancel').expect(200);
    });

    it('returns 400 for an invalid transition', async () => {
      cancelAppointmentUseCase.execute.mockRejectedValue(new BadRequestException());

      await request(server()).post('/appointments/ANG-RDV-2026-AbCdEfGh/cancel').expect(400);
    });
  });

  describe('POST /appointments/:reference/confirm', () => {
    it('returns 401 without a bearer token', async () => {
      await request(server()).post('/appointments/ANG-RDV-2026-AbCdEfGh/confirm').expect(401);
    });

    it('returns 403 for a CLIENT role', async () => {
      accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });

      await request(server())
        .post('/appointments/ANG-RDV-2026-AbCdEfGh/confirm')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });

    it('confirms for a MANAGER role', async () => {
      accessTokenService.verify.mockReturnValue({ sub: 'staff-1', role: 'MANAGER' });
      confirmAppointmentUseCase.execute.mockResolvedValue(sampleAppointment('CONFIRMED'));

      await request(server())
        .post('/appointments/ANG-RDV-2026-AbCdEfGh/confirm')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(confirmAppointmentUseCase.execute).toHaveBeenCalledWith('ANG-RDV-2026-AbCdEfGh', 'staff-1');
    });
  });
});
