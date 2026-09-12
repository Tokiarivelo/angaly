import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  IPatternProjectRepository,
  PATTERN_PROJECT_REPOSITORY,
} from '../../domain/repositories/pattern-project.repository';
import {
  IPatternVersionRepository,
  PATTERN_VERSION_REPOSITORY,
} from '../../domain/repositories/pattern-version.repository';
import { PatternVersionEntity } from '../../domain/entities/pattern-version.entity';

@Injectable()
export class RestorePatternVersionUseCase {
  constructor(
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
    @Inject(PATTERN_VERSION_REPOSITORY)
    private readonly versionRepository: IPatternVersionRepository,
  ) {}

  async execute(versionId: string, customerId: string): Promise<PatternVersionEntity> {
    const versionToRestore = await this.versionRepository.findById(versionId);
    if (!versionToRestore) {
      throw new NotFoundException(`Version introuvable: ${versionId}`);
    }

    const project = await this.projectRepository.findById(versionToRestore.projectId);
    if (!project) {
      throw new NotFoundException(`Projet associé introuvable: ${versionToRestore.projectId}`);
    }

    if (project.customerId !== customerId) {
      throw new ForbiddenException('Vous n’avez pas accès à ce projet de patron.');
    }

    const latest = await this.versionRepository.findLatestByProjectId(project.id);
    const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;

    const piecesData = (versionToRestore.pieces ?? []).map((p) => ({
      name: p.name,
      dimensionsJson: p.dimensionsJson,
      fabricRecommendation: p.fabricRecommendation,
      quantity: p.quantity,
      grainlineJson: p.grainlineJson,
      seamAllowanceCm: p.seamAllowanceCm,
      notchesJson: p.notchesJson,
    }));

    const restoredVersion = await this.versionRepository.create({
      id: randomUUID(),
      projectId: project.id,
      versionNumber: nextVersionNumber,
      changeLabel: `Restauration depuis v${versionToRestore.versionNumber}`,
      parametersJson: versionToRestore.parametersJson,
      generatedByAI: false,
      pieces: piecesData,
    });

    return restoredVersion;
  }
}
