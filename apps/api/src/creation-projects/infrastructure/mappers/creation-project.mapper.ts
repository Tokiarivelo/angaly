import type { CreationProject as PrismaCreationProject } from '@angaly/database';
import type { CreationProjectStage, Role } from '@angaly/types';

import {
  CreationProjectDetailResponseDto,
  CreationProjectResponseDto,
} from '../../application/dtos/creation-project-response.dto';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';

export class CreationProjectMapper {
  static toDomain(
    row: PrismaCreationProject & {
      quote?: { quoteNumber: string } | null;
      customer?: { firstName: string; lastName: string } | null;
      assignedTo?: { id: string; email: string; role: string } | null;
      stageEvents?: Array<{
        id: string;
        fromStage: string | null;
        toStage: string;
        createdAt: Date;
        changedBy: { email: string } | null;
      }>;
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
      assignedTo: row.assignedTo
        ? { id: row.assignedTo.id, email: row.assignedTo.email, role: row.assignedTo.role as Role }
        : null,
      stageHistory: row.stageEvents?.map((event) => ({
        id: event.id,
        fromStage: event.fromStage as CreationProjectStage | null,
        toStage: event.toStage as CreationProjectStage,
        changedByEmail: event.changedBy?.email ?? null,
        createdAt: event.createdAt,
      })),
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
    dto.assignedTo = entity.assignedTo;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }

  static toDetailResponse(entity: CreationProjectEntity): CreationProjectDetailResponseDto {
    const dto = Object.assign(new CreationProjectDetailResponseDto(), CreationProjectMapper.toResponse(entity));
    dto.stageHistory = entity.stageHistory.map((event) => ({
      id: event.id,
      fromStage: event.fromStage,
      toStage: event.toStage,
      changedByEmail: event.changedByEmail,
      createdAt: event.createdAt.toISOString(),
    }));
    return dto;
  }
}
