import { HttpResponse, http } from 'msw';
import { MediaEntityType, QuoteStatus } from '@angaly/types';
import type { CustomerDto, MediaDto, QuoteDto } from '@angaly/types';

const API_BASE_URL = 'http://localhost:3003/api';

export const SAMPLE_CUSTOMER_PROFILE: CustomerDto = {
  id: 'customer-1',
  userId: 'user-1',
  firstName: 'Nirina',
  lastName: 'Rakoto',
  phone: '+261 34 12 345 67',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SAMPLE_INSPIRATION_MEDIA: MediaDto = {
  id: 'media-1',
  url: 'http://minio.local/quotes/inspiration-1.jpg',
  altText: "Photo d'inspiration",
  mimeType: 'image/jpeg',
  width: null,
  height: null,
  entityType: MediaEntityType.QUOTE_DOCUMENT,
  entityId: null,
  sortOrder: 0,
};

export const SAMPLE_QUOTE: QuoteDto = {
  id: 'quote-1',
  quoteNumber: 'ANG-DEV-2026-A1B2C3D4',
  customerId: 'customer-1',
  creationId: null,
  description: 'Demande sur mesure — Robe de mariée',
  lineItems: [],
  subtotal: '0.00',
  depositAmount: '0.00',
  balanceAmount: '0.00',
  total: '0.00',
  status: QuoteStatus.DRAFT,
  validUntil: null,
  estimatedDelayDays: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

export const demandeSurMesureHandlers = [
  http.get(`${API_BASE_URL}/customers/me`, () => HttpResponse.json({ success: true, data: SAMPLE_CUSTOMER_PROFILE })),
  http.post(`${API_BASE_URL}/media/presigned-upload`, () =>
    HttpResponse.json({
      success: true,
      data: {
        bucket: 'quotes',
        objectKey: 'inspiration/test.jpg',
        uploadUrl: `${API_BASE_URL}/mock-minio-upload`,
        expiresInSeconds: 900,
      },
    }),
  ),
  http.put(`${API_BASE_URL}/mock-minio-upload`, () => new HttpResponse(null, { status: 200 })),
  http.post(`${API_BASE_URL}/media/confirm`, () => HttpResponse.json({ success: true, data: SAMPLE_INSPIRATION_MEDIA })),
  http.post(`${API_BASE_URL}/quotes/requests`, () => HttpResponse.json({ success: true, data: SAMPLE_QUOTE })),
];
