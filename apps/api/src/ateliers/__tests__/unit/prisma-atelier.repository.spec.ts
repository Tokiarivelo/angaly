import type { AtelierRecord} from '../../infrastructure/repositories/prisma-atelier.repository';
import { PrismaAtelierRepository } from '../../infrastructure/repositories/prisma-atelier.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockAtelierDelegate {
  findUnique: jest.Mock;
  findMany: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; atelier: MockAtelierDelegate } {
  const atelier: MockAtelierDelegate = { findUnique: jest.fn(), findMany: jest.fn() };
  const prisma = { atelier } as unknown as PrismaService;
  return { prisma, atelier };
}

const RAW_HOURS = {
  monday: { isOpen: false, slots: [] },
  tuesday: { isOpen: false, slots: [] },
  wednesday: { isOpen: false, slots: [] },
  thursday: { isOpen: false, slots: [] },
  friday: { isOpen: false, slots: [] },
  saturday: { isOpen: false, slots: [] },
  sunday: { isOpen: false, slots: [] },
};

function sampleRecord(): AtelierRecord {
  return {
    id: 'atelier-1',
    slug: 'antananarivo-centre',
    name: 'Atelier Antananarivo Centre',
    address: '12 Rue de la Paix',
    city: 'Antananarivo',
    phone: null,
    openingHoursJson: RAW_HOURS,
    servicesJson: null,
    latitude: null,
    longitude: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    media: [],
  };
}

describe('PrismaAtelierRepository', () => {
  it('findBySlug() returns null when no row matches', async () => {
    const { prisma, atelier } = buildPrismaServiceMock();
    atelier.findUnique.mockResolvedValue(null);
    const repository = new PrismaAtelierRepository(prisma);

    expect(await repository.findBySlug('missing')).toBeNull();
  });

  it('findBySlug() maps the row to a domain entity when found', async () => {
    const { prisma, atelier } = buildPrismaServiceMock();
    atelier.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaAtelierRepository(prisma);

    const result = await repository.findBySlug('antananarivo-centre');

    expect(result?.slug).toBe('antananarivo-centre');
  });

  it('findById() maps the row to a domain entity when found', async () => {
    const { prisma, atelier } = buildPrismaServiceMock();
    atelier.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaAtelierRepository(prisma);

    const result = await repository.findById('atelier-1');

    expect(result?.id).toBe('atelier-1');
    expect(atelier.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'atelier-1' } }));
  });

  it('list() sorts by city then name and returns every atelier', async () => {
    const { prisma, atelier } = buildPrismaServiceMock();
    atelier.findMany.mockResolvedValue([sampleRecord()]);
    const repository = new PrismaAtelierRepository(prisma);

    const result = await repository.list();

    const call = atelier.findMany.mock.calls[0] as [{ orderBy: unknown }];
    expect(call[0].orderBy).toEqual([{ city: 'asc' }, { name: 'asc' }]);
    expect(result).toHaveLength(1);
  });
});
