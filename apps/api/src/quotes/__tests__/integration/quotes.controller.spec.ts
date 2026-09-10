import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ConflictException, ForbiddenException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { QuoteProps } from '../../domain/entities/quote.entity';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import { AcceptQuoteUseCase } from '../../application/use-cases/accept-quote.use-case';
import { CreateQuoteFromDesignBriefUseCase } from '../../application/use-cases/create-quote-from-design-brief.use-case';
import { CreateQuoteFromSurMesureRequestUseCase } from '../../application/use-cases/create-quote-from-sur-mesure-request.use-case';
import { ExportQuotePdfUseCase } from '../../application/use-cases/export-quote-pdf.use-case';
import { GetQuoteByNumberUseCase } from '../../application/use-cases/get-quote-by-number.use-case';
import { RejectQuoteUseCase } from '../../application/use-cases/reject-quote.use-case';
import { RequestQuoteChangeUseCase } from '../../application/use-cases/request-quote-change.use-case';
import { SendQuoteUseCase } from '../../application/use-cases/send-quote.use-case';
import { UpdateQuoteDraftUseCase } from '../../application/use-cases/update-quote-draft.use-case';
import { QuotesController } from '../../presentation/controllers/quotes.controller';

function sampleQuote(overrides: Partial<QuoteProps> = {}): QuoteEntity {
  return QuoteEntity.create({
    id: 'quote-1',
    quoteNumber: 'ANG-DEV-2026-abc12345',
    customerId: 'customer-1',
    creationId: null,
    description: 'Demande sur mesure — Robe de mariée',
    lineItems: [],
    subtotal: '0.00',
    depositAmount: '0.00',
    balanceAmount: '0.00',
    total: '0.00',
    status: 'DRAFT',
    validUntil: null,
    estimatedDelayDays: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

describe('QuotesController (integration)', () => {
  let app: INestApplication;
  const createQuoteFromSurMesureRequestUseCase = { execute: jest.fn() };
  const createQuoteFromDesignBriefUseCase = { execute: jest.fn() };
  const updateQuoteDraftUseCase = { execute: jest.fn() };
  const sendQuoteUseCase = { execute: jest.fn() };
  const getQuoteByNumberUseCase = { execute: jest.fn() };
  const acceptQuoteUseCase = { execute: jest.fn() };
  const rejectQuoteUseCase = { execute: jest.fn() };
  const requestQuoteChangeUseCase = { execute: jest.fn() };
  const exportQuotePdfUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [QuotesController],
      providers: [
        { provide: CreateQuoteFromSurMesureRequestUseCase, useValue: createQuoteFromSurMesureRequestUseCase },
        { provide: CreateQuoteFromDesignBriefUseCase, useValue: createQuoteFromDesignBriefUseCase },
        { provide: UpdateQuoteDraftUseCase, useValue: updateQuoteDraftUseCase },
        { provide: SendQuoteUseCase, useValue: sendQuoteUseCase },
        { provide: GetQuoteByNumberUseCase, useValue: getQuoteByNumberUseCase },
        { provide: AcceptQuoteUseCase, useValue: acceptQuoteUseCase },
        { provide: RejectQuoteUseCase, useValue: rejectQuoteUseCase },
        { provide: RequestQuoteChangeUseCase, useValue: requestQuoteChangeUseCase },
        { provide: ExportQuotePdfUseCase, useValue: exportQuotePdfUseCase },
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

  describe('POST /quotes/requests', () => {
    it('rejects without a bearer token (401)', async () => {
      await request(server()).post('/quotes/requests').send({ garmentType: 'Robe' }).expect(401);
    });

    it('creates a DRAFT quote for the authenticated CLIENT (201)', async () => {
      createQuoteFromSurMesureRequestUseCase.execute.mockResolvedValue(sampleQuote());

      const [header, value] = bearerFor('CLIENT');
      const response = await request(server())
        .post('/quotes/requests')
        .set(header, value)
        .send({ garmentType: 'Robe de mariée', occasion: 'Mariage' })
        .expect(201);

      expect((response.body as { quoteNumber: string }).quoteNumber).toBe('ANG-DEV-2026-abc12345');
      expect(createQuoteFromSurMesureRequestUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', garmentType: 'Robe de mariée' }),
      );
    });

    it('rejects a body missing the required garmentType (400)', async () => {
      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/quotes/requests').set(header, value).send({}).expect(400);
    });
  });

  describe('POST /quotes/design-briefs', () => {
    it('creates a DRAFT quote referencing a Creation (201)', async () => {
      createQuoteFromDesignBriefUseCase.execute.mockResolvedValue(sampleQuote({ creationId: 'creation-1' }));

      const [header, value] = bearerFor('CLIENT');
      await request(server())
        .post('/quotes/design-briefs')
        .set(header, value)
        .send({ creationId: 'creation-1', options: { tissu: 'soie' } })
        .expect(201);
    });

    it('returns 404 when the use-case reports an unknown Creation', async () => {
      createQuoteFromDesignBriefUseCase.execute.mockRejectedValue(new NotFoundException('Creation "missing" not found'));

      const [header, value] = bearerFor('CLIENT');
      await request(server())
        .post('/quotes/design-briefs')
        .set(header, value)
        .send({ creationId: 'missing', options: {} })
        .expect(404);
    });
  });

  describe('PATCH /quotes/design-briefs/:id', () => {
    it('saves the draft (200)', async () => {
      updateQuoteDraftUseCase.execute.mockResolvedValue(sampleQuote());

      const [header, value] = bearerFor('CLIENT');
      await request(server())
        .patch('/quotes/design-briefs/quote-1')
        .set(header, value)
        .send({ notes: 'Ajouter une traîne' })
        .expect(200);
    });

    it('returns 409 when the use-case reports a non-DRAFT quote', async () => {
      updateQuoteDraftUseCase.execute.mockRejectedValue(new ConflictException('Only a DRAFT quote can be edited'));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).patch('/quotes/design-briefs/quote-1').set(header, value).send({}).expect(409);
    });
  });

  describe('POST /quotes/:quoteNumber/send', () => {
    const body = { lineItems: [{ label: 'Tissu', quantity: 1, unitPrice: '100.00' }], depositAmount: '30.00', total: '100.00' };

    it('rejects a CLIENT caller (403)', async () => {
      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/quotes/ANG-DEV-2026-abc12345/send').set(header, value).send(body).expect(403);
    });

    it('allows a MANAGER caller (200)', async () => {
      sendQuoteUseCase.execute.mockResolvedValue(sampleQuote({ status: 'SENT' }));

      const [header, value] = bearerFor('MANAGER');
      await request(server()).post('/quotes/ANG-DEV-2026-abc12345/send').set(header, value).send(body).expect(200);
    });
  });

  describe('GET /quotes/:quoteNumber', () => {
    it('returns the quote for its owner (200)', async () => {
      getQuoteByNumberUseCase.execute.mockResolvedValue(sampleQuote());

      const [header, value] = bearerFor('CLIENT');
      await request(server()).get('/quotes/ANG-DEV-2026-abc12345').set(header, value).expect(200);
    });

    it('returns 404 for an unknown quoteNumber', async () => {
      getQuoteByNumberUseCase.execute.mockRejectedValue(new NotFoundException('Quote "missing" not found'));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).get('/quotes/missing').set(header, value).expect(404);
    });

    it('returns 403 for a quote owned by another customer', async () => {
      getQuoteByNumberUseCase.execute.mockRejectedValue(new ForbiddenException('This quote does not belong to the current user'));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).get('/quotes/ANG-DEV-2026-abc12345').set(header, value).expect(403);
    });
  });

  describe('POST /quotes/:quoteNumber/accept', () => {
    it('accepts the quote (200)', async () => {
      acceptQuoteUseCase.execute.mockResolvedValue(sampleQuote({ status: 'ACCEPTED' }));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/quotes/ANG-DEV-2026-abc12345/accept').set(header, value).expect(200);
    });

    it('returns 409 for an invalid transition', async () => {
      acceptQuoteUseCase.execute.mockRejectedValue(new ConflictException('Cannot accept a quote with status "DRAFT"'));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/quotes/ANG-DEV-2026-abc12345/accept').set(header, value).expect(409);
    });
  });

  describe('POST /quotes/:quoteNumber/reject', () => {
    it('rejects the quote (200)', async () => {
      rejectQuoteUseCase.execute.mockResolvedValue(sampleQuote({ status: 'REJECTED' }));

      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/quotes/ANG-DEV-2026-abc12345/reject').set(header, value).expect(200);
    });
  });

  describe('POST /quotes/:quoteNumber/request-change', () => {
    it('accepts a change request (200)', async () => {
      requestQuoteChangeUseCase.execute.mockResolvedValue(undefined);

      const [header, value] = bearerFor('CLIENT');
      await request(server())
        .post('/quotes/ANG-DEV-2026-abc12345/request-change')
        .set(header, value)
        .send({ message: 'Please adjust the sleeves' })
        .expect(200);
    });

    it('rejects a body missing the required message (400)', async () => {
      const [header, value] = bearerFor('CLIENT');
      await request(server()).post('/quotes/ANG-DEV-2026-abc12345/request-change').set(header, value).send({}).expect(400);
    });
  });

  describe('GET /quotes/:quoteNumber/pdf', () => {
    it('returns the generated PDF URL (200)', async () => {
      exportQuotePdfUseCase.execute.mockResolvedValue('http://minio.local/quotes/devis.pdf');

      const [header, value] = bearerFor('CLIENT');
      const response = await request(server()).get('/quotes/ANG-DEV-2026-abc12345/pdf').set(header, value).expect(200);

      expect((response.body as { url: string }).url).toBe('http://minio.local/quotes/devis.pdf');
    });
  });
});
