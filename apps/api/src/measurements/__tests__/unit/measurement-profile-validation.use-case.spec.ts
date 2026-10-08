import { BadRequestException } from '@nestjs/common';
import { MeasurementUnit } from '@angaly/types';
import { CreateMeasurementProfileUseCase } from '../../application/use-cases/create-measurement-profile.use-case';
import { UpdateMeasurementProfileUseCase } from '../../application/use-cases/update-measurement-profile.use-case';
import { MeasurementProfile } from '../../domain/entities/measurement-profile.entity';
import type { IMeasurementProfileRepository } from '../../domain/repositories/measurement-profile.repository';

describe('measurement profile use cases — plausibility validation', () => {
  const repository = {
    save: jest.fn(),
    findById: jest.fn(),
  } as unknown as jest.Mocked<IMeasurementProfileRepository>;

  beforeEach(() => jest.clearAllMocks());

  it('creates a profile with extended measurements', async () => {
    const profile = await new CreateMeasurementProfileUseCase(repository).execute('cust-1', {
      label: 'Mariage',
      unit: MeasurementUnit.CM,
      values: { TOUR_TAILLE: 70, TOUR_SOUS_POITRINE: 78, HAUTEUR_POITRINE: 26, TOUR_BASSIN: 0 },
    });

    expect(profile.values.get('TOUR_SOUS_POITRINE')).toBe(78);
    expect(profile.values.has('TOUR_BASSIN')).toBe(false);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects an implausible value on create without saving', async () => {
    await expect(
      new CreateMeasurementProfileUseCase(repository).execute('cust-1', {
        label: 'Typo',
        unit: MeasurementUnit.CM,
        values: { TOUR_TAILLE: 700 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects an implausible value on update, checking against the profile unit', async () => {
    const existing = MeasurementProfile.create('p1', 'cust-1', 'Inch', MeasurementUnit.INCH, new Map([['TOUR_TAILLE', 28]]));
    repository.findById.mockResolvedValue(existing);

    await expect(
      new UpdateMeasurementProfileUseCase(repository).execute('p1', 'cust-1', { values: { TOUR_TAILLE: 280 } }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      new UpdateMeasurementProfileUseCase(repository).execute('p1', 'cust-1', { values: { TOUR_TAILLE: 30 } }),
    ).resolves.toBeDefined();
  });
});
