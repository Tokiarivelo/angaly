import { AtelierMapper } from '../../infrastructure/mappers/atelier.mapper';
import type { AtelierRecord } from '../../infrastructure/repositories/prisma-atelier.repository';

const RAW_HOURS = {
  monday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
  tuesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
  wednesday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
  thursday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
  friday: { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
  saturday: { isOpen: false, slots: [] },
  sunday: { isOpen: false, slots: [] },
};

function atelierRecord(overrides: Partial<AtelierRecord> = {}): AtelierRecord {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: '12 Rue de la Paix',
    city: 'Antananarivo',
    phone: '+261 34 00 000 00',
    openingHoursJson: RAW_HOURS,
    servicesJson: ['Essayage', 'Retouche'],
    latitude: -18.8792,
    longitude: 47.5079,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    media: [{ id: 'media-1', url: 'http://localhost:9000/ateliers/a.jpg', altText: null, sortOrder: 0 }],
    ...overrides,
  };
}

describe('AtelierMapper', () => {
  it('maps a Prisma record to a domain entity, parsing opening hours and services', () => {
    const entity = AtelierMapper.toDomain(atelierRecord());

    expect(entity.id).toBe('atelier-1');
    expect(entity.openingHours.monday.isOpen).toBe(true);
    expect(entity.services).toEqual(['Essayage', 'Retouche']);
    expect(entity.media[0]?.altText).toBe('');
  });

  it('maps a record with a null servicesJson to an empty services array', () => {
    const entity = AtelierMapper.toDomain(atelierRecord({ servicesJson: null }));
    expect(entity.services).toEqual([]);
  });

  it('maps a domain entity to a response DTO with ISO date strings', () => {
    const entity = AtelierMapper.toDomain(atelierRecord());
    const dto = AtelierMapper.toResponseDto(entity);

    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.openingHours.sunday.isOpen).toBe(false);
    expect(dto.latitude).toBe(-18.8792);
  });
});
