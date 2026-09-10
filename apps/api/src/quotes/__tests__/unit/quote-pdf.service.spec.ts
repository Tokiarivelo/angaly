import type { QuoteProps } from '../../domain/entities/quote.entity';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import { QuotePdfService } from '../../infrastructure/services/quote-pdf.service';

function buildProps(overrides: Partial<QuoteProps> = {}): QuoteProps {
  return {
    id: 'quote-1',
    quoteNumber: 'ANG-DEV-2026-abc12345',
    customerId: 'customer-1',
    creationId: null,
    description: 'Demande sur mesure — Robe de mariée',
    lineItems: [{ label: 'Tissu satin', quantity: 3, unitPrice: '20.00' }],
    subtotal: '60.00',
    depositAmount: '20.00',
    balanceAmount: '40.00',
    total: '60.00',
    status: 'SENT',
    validUntil: new Date('2026-12-01T00:00:00.000Z'),
    estimatedDelayDays: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('QuotePdfService.render', () => {
  it('renders a non-empty PDF buffer starting with the %PDF magic bytes', async () => {
    const service = new QuotePdfService();

    const buffer = await service.render(QuoteEntity.create(buildProps()));

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
  });

  it('renders a quote with no line items without throwing', async () => {
    const service = new QuotePdfService();

    await expect(
      service.render(
        QuoteEntity.create(
          buildProps({ lineItems: [], subtotal: '0.00', depositAmount: '0.00', balanceAmount: '0.00', total: '0.00' }),
        ),
      ),
    ).resolves.toBeInstanceOf(Buffer);
  });
});
