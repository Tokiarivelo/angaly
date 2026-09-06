import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { AtelierEntity } from '../../domain/entities/atelier.entity';
import { IAtelierRepository } from '../../domain/repositories/atelier.repository';
import { AtelierMapper } from '../mappers/atelier.mapper';

export const ATELIER_SELECT = {
  id: true,
  slug: true,
  name: true,
  address: true,
  city: true,
  phone: true,
  openingHoursJson: true,
  servicesJson: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
  media: {
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true, altText: true, sortOrder: true },
  },
} satisfies Prisma.AtelierSelect;

export type AtelierRecord = Prisma.AtelierGetPayload<{ select: typeof ATELIER_SELECT }>;

@Injectable()
export class PrismaAtelierRepository implements IAtelierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<AtelierEntity | null> {
    const record = await this.prisma.atelier.findUnique({ where: { slug }, select: ATELIER_SELECT });
    return record ? AtelierMapper.toDomain(record) : null;
  }

  async list(): Promise<AtelierEntity[]> {
    const records = await this.prisma.atelier.findMany({
      select: ATELIER_SELECT,
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    });
    return records.map((record) => AtelierMapper.toDomain(record));
  }
}
