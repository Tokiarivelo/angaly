import { Inject, Injectable } from '@nestjs/common';
import { CreationProjectEntity } from '../../domain/entities/creation-project.entity';
import {
  CREATION_PROJECT_REPOSITORY,
  ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';
import type { CreateAdminCreationProjectDto } from '../dtos/create-admin-creation-project.dto';

@Injectable()
export class CreateAdminCreationProjectUseCase {
  constructor(
    @Inject(CREATION_PROJECT_REPOSITORY)
    private readonly repository: ICreationProjectRepository,
  ) {}

  async execute(dto: CreateAdminCreationProjectDto, creatorUserId: string): Promise<CreationProjectEntity> {
    const metaParts: string[] = [];
    if (dto.garmentType) metaParts.push(`Type : ${dto.garmentType}`);
    if (dto.occasion) metaParts.push(`Événement : ${dto.occasion}`);
    if (dto.eventDate) metaParts.push(`Date événement : ${dto.eventDate}`);
    if (dto.budgetRange) metaParts.push(`Budget indicatif : ${dto.budgetRange}`);
    if (dto.inspirationMediaUrls && dto.inspirationMediaUrls.length > 0) {
      metaParts.push(`Inspirations : ${dto.inspirationMediaUrls.join(', ')}`);
    }

    let fullDescription = dto.description?.trim() || '';
    if (metaParts.length > 0) {
      const header = metaParts.join(' · ');
      fullDescription = fullDescription ? `${header}\n\n${fullDescription}` : header;
    }

    return this.repository.createAdminProject({
      customerId: dto.customerId,
      newCustomer: dto.newCustomer
        ? {
            firstName: dto.newCustomer.firstName,
            lastName: dto.newCustomer.lastName,
            email: dto.newCustomer.email,
            phone: dto.newCustomer.phone ?? null,
          }
        : undefined,
      title: dto.title,
      description: fullDescription || null,
      stage: dto.initialStage,
      quoteId: dto.quoteId ?? null,
      assignedToId: dto.assignedToId ?? null,
      creatorUserId,
    });
  }
}
