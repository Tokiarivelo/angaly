import { NotFoundException } from '@nestjs/common';

import { GetAtelierBySlugUseCase } from '../../application/use-cases/get-atelier-by-slug.use-case';
import { AtelierEntity } from '../../domain/entities/atelier.entity';
import type { IAtelierRepository } from '../../domain/repositories/atelier.repository';
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

function buildRepository(): jest.Mocked<IAtelierRepository> {
  return { findBySlug: jest.fn(), findById: jest.fn(), list: jest.fn() };
}

function sampleAtelier(): AtelierEntity {
  return AtelierEntity.create({
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: '12 Rue de la Paix',
    city: 'Antananarivo',
    phone: null,
    openingHours: CLOSED_WEEK,
    services: [],
    latitude: null,
    longitude: null,
    media: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetAtelierBySlugUseCase', () => {
  it('returns the atelier when found', async () => {
    const repository = buildRepository();
    repository.findBySlug.mockResolvedValue(sampleAtelier());
    const useCase = new GetAtelierBySlugUseCase(repository);

    const result = await useCase.execute('antananarivo-centre');

    expect(repository.findBySlug).toHaveBeenCalledWith('antananarivo-centre');
    expect(result.slug).toBe('antananarivo-centre');
  });

  it('throws NotFoundException when no atelier matches the slug', async () => {
    const repository = buildRepository();
    repository.findBySlug.mockResolvedValue(null);
    const useCase = new GetAtelierBySlugUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });
});
