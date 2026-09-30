import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import { ICreationProjectRepository } from '../../domain/repositories/creation-project.repository';
import { CreationProjectMapper } from '../mappers/creation-project.mapper';

@Injectable()
export class PrismaCreationProjectRepository implements ICreationProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomerId(customerId: string): Promise<CreationProjectEntity[]> {
    const rows = await this.prisma.creationProject.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => CreationProjectMapper.toDomain(row));
  }

  async findById(id: string): Promise<CreationProjectEntity | null> {
    const row = await this.prisma.creationProject.findUnique({ where: { id } });
    return row ? CreationProjectMapper.toDomain(row) : null;
  }
}
