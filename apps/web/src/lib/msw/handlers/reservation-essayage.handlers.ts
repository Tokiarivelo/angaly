import { HttpResponse, http } from 'msw';
import { AppointmentStatus, AppointmentType, ProductAvailability } from '@angaly/types';
import type { AppointmentDto, AtelierDto, DaySlotsResponseDto, MonthAvailabilityDayDto, ProductDto } from '@angaly/types';

const API_BASE_URL = 'http://localhost:3003/api';

export const SAMPLE_ATELIERS: AtelierDto[] = [
  {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Flagship',
    address: "12 Avenue de l'Indépendance",
    city: 'Antananarivo',
    phone: null,
    openingHours: {
      monday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      tuesday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      wednesday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      thursday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      friday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      saturday: { isOpen: false, slots: [] },
      sunday: { isOpen: false, slots: [] },
    },
    services: [],
    latitude: null,
    longitude: null,
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const SAMPLE_PRODUCT: ProductDto = {
  id: 'product-1',
  sku: 'RS-24-FW',
  slug: 'robe-solene',
  name: 'Robe Solène',
  description: 'Une robe raffinée.',
  price: { amount: '1450000', currency: 'MGA' },
  status: ProductAvailability.AVAILABLE,
  category: { id: 'cat-robes', slug: 'robes', name: 'Robes' },
  media: [{ id: 'media-1', url: 'http://localhost:9000/products/robe-solene.jpg', altText: 'Robe Solène', sortOrder: 0 }],
  variants: [
    { id: 'variant-1', sku: 'RS-24-FW-34', size: '34', color: 'Ivoire', material: null, priceOverride: null, quantityAvailable: 2, quantityReserved: 0 },
    { id: 'variant-2', sku: 'RS-24-FW-36', size: '36', color: 'Ivoire', material: null, priceOverride: null, quantityAvailable: 2, quantityReserved: 0 },
    { id: 'variant-3', sku: 'RS-24-FW-38', size: '38', color: 'Ivoire', material: null, priceOverride: null, quantityAvailable: 2, quantityReserved: 0 },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SAMPLE_MONTH_AVAILABILITY: MonthAvailabilityDayDto[] = [
  { date: '2026-09-14', status: 'available' },
  { date: '2026-09-15', status: 'full' },
  { date: '2026-09-16', status: 'closed' },
];

export const SAMPLE_DAY_SLOTS: DaySlotsResponseDto = {
  slots: ['2026-09-14T09:00:00.000Z', '2026-09-14T09:45:00.000Z'],
};

export const SAMPLE_APPOINTMENT: AppointmentDto = {
  id: 'appointment-1',
  reference: 'ANG-RDV-2026-EssaieGh',
  customerId: null,
  firstName: 'Nirina',
  lastName: 'Rakoto',
  phone: '+261 34 12 345 67',
  email: 'nirina@example.com',
  type: AppointmentType.ESSAYAGE,
  atelierId: 'atelier-1',
  assignedToId: null,
  scheduledAt: '2026-09-14T09:00:00.000Z',
  durationMinutes: 45,
  status: AppointmentStatus.PENDING,
  message: 'Robe Solène — Taille 36 — Réf. RS-24-FW',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

export const reservationEssayageHandlers = [
  http.get(`${API_BASE_URL}/products/id/:productId`, () => HttpResponse.json({ success: true, data: SAMPLE_PRODUCT })),
  http.get(`${API_BASE_URL}/ateliers`, () => HttpResponse.json({ success: true, data: SAMPLE_ATELIERS })),
  http.get(`${API_BASE_URL}/appointments/availability`, () =>
    HttpResponse.json({ success: true, data: SAMPLE_MONTH_AVAILABILITY }),
  ),
  http.get(`${API_BASE_URL}/appointments/availability/slots`, () =>
    HttpResponse.json({ success: true, data: SAMPLE_DAY_SLOTS }),
  ),
  http.post(`${API_BASE_URL}/appointments`, () => HttpResponse.json({ success: true, data: SAMPLE_APPOINTMENT })),
];
