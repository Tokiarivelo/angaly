import type { CreationProject as PrismaCreationProject } from '@angaly/database';
import type { CreationProjectStage } from '@angaly/types';

import { CreationProjectResponseDto } from '../../application/dtos/creation-project-response.dto';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';

export class CreationProjectMapper {
  static toDomain(
    row: PrismaCreationProject & {
      quote?: { quoteNumber: string } | null;
      customer?: { firstName: string; lastName: string } | null;
    },
  ): CreationProjectEntity {
    const customerName = row.customer
      ? `${row.customer.firstName} ${row.customer.lastName}`.trim()
      : null;

    return CreationProjectEntity.create({
      id: row.id,
      reference: row.reference,
      customerId: row.customerId,
      title: row.title,
      description: row.description,
      stage: row.stage as CreationProjectStage,
      quoteId: row.quoteId,
      quoteNumber: row.quote?.quoteNumber ?? null,
      customerName,
      creationId: row.creationId,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toResponse(entity: CreationProjectEntity): CreationProjectResponseDto {
    const dto = new CreationProjectResponseDto();
    dto.id = entity.id;
    dto.reference = entity.reference;
    dto.title = entity.title;
    dto.description = entity.description;
    dto.stage = entity.stage;
    dto.quoteId = entity.quoteId;
    dto.quoteNumber = entity.quoteNumber;
    dto.customerName = entity.customerName;
    dto.creationId = entity.creationId;
    dto.completedAt = entity.completedAt?.toISOString() ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
