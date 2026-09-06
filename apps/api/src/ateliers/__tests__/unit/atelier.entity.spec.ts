import type { AtelierProps } from '../../domain/entities/atelier.entity';
import { AtelierEntity } from '../../domain/entities/atelier.entity';
import type { AtelierOpeningHours } from '../../domain/value-objects/opening-hours.vo';

const CLOSED_WEEK: AtelierOpeningHours = {
  monday: { isOpen: false, slots: [] },
  tuesday: { isOpen: false, slots: [] },
  wednesday: { isOpen: false, slots: [] },
  thursday: { isOpen: false, slots: [] },
  friday: { isOpen: false, slots: [] },
  saturday: { isOpen: false, slots: [] },
  sunday: { isOpen: false, slots: [] },
};

function baseProps(): AtelierProps {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: '12 Rue de la Paix',
    city: 'Antananarivo',
    phone: '+261 34 00 000 00',
    openingHours: CLOSED_WEEK,
    services: ['Essayage', 'Consultation'],
    latitude: -18.8792,
    longitude: 47.5079,
    media: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

describe('AtelierEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = AtelierEntity.create(baseProps());

    expect(entity.id).toBe('atelier-1');
    expect(entity.city).toBe('Antananarivo');
    expect(entity.services).toEqual(['Essayage', 'Consultation']);
    expect(entity.hasCoordinates).toBe(true);
  });

  it('accepts both coordinates null (no map pin yet)', () => {
    const entity = AtelierEntity.create({ ...baseProps(), latitude: null, longitude: null });
    expect(entity.hasCoordinates).toBe(false);
  });

  it('rejects an empty slug', () => {
    expect(() => AtelierEntity.create({ ...baseProps(), slug: '  ' })).toThrow(
      'Atelier.slug must not be empty',
    );
  });

  it('rejects an empty name', () => {
    expect(() => AtelierEntity.create({ ...baseProps(), name: '' })).toThrow(
      'Atelier.name must not be empty',
    );
  });

  it('rejects a latitude set without a longitude', () => {
    expect(() => AtelierEntity.create({ ...baseProps(), longitude: null })).toThrow(
      'Atelier.latitude and Atelier.longitude must both be set or both be null',
    );
  });

  it('rejects a longitude set without a latitude', () => {
    expect(() => AtelierEntity.create({ ...baseProps(), latitude: null })).toThrow(
      'Atelier.latitude and Atelier.longitude must both be set or both be null',
    );
  });
});
