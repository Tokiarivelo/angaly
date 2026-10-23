import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  IPatternProjectRepository,
  PATTERN_PROJECT_REPOSITORY,
} from '../../domain/repositories/pattern-project.repository';
import {
  IPatternVersionRepository,
  PATTERN_VERSION_REPOSITORY,
} from '../../domain/repositories/pattern-version.repository';
import type { PatternVersionEntity } from '../../domain/entities/pattern-version.entity';
import type { PatternPieceInputDto } from '../dtos/save-pattern-edits.dto';

const isPoint = (p: unknown): p is { x: number; y: number } =>
  typeof p === 'object' &&
  p !== null &&
  Number.isFinite((p as { x?: unknown }).x) &&
  Number.isFinite((p as { y?: unknown }).y);

/** Saves pieces hand-edited in the pattern studio as a NEW version (the previous ones stay restorable). */
@Injectable()
export class SavePatternEditsUseCase {
  constructor(
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
    @Inject(PATTERN_VERSION_REPOSITORY)
    private readonly versionRepository: IPatternVersionRepository,
  ) {}

  async execute(
    baseVersionId: string,
    customerId: string,
    pieces: PatternPieceInputDto[],
    changeLabel?: string,
  ): Promise<PatternVersionEntity> {
    const base = await this.versionRepository.findById(baseVersionId);
    if (!base) throw new NotFoundException(`Version introuvable: ${baseVersionId}`);

    const project = await this.projectRepository.findById(base.projectId);
    if (!project) throw new NotFoundException(`Projet associé introuvable: ${base.projectId}`);
    if (project.customerId !== customerId) {
      throw new ForbiddenException('Vous n’avez pas accès à ce projet de patron.');
    }

    pieces.forEach((piece) => {
      const outline = (piece.dimensionsJson as { outlineMm?: unknown }).outlineMm;
      if (!Array.isArray(outline) || outline.length < 3 || !outline.every(isPoint)) {
        throw new BadRequestException(
          `La pièce « ${piece.name} » doit avoir un contour d’au moins 3 points valides.`,
        );
      }
    });

    const latest = await this.versionRepository.findLatestByProjectId(project.id);
    const trimmed = changeLabel?.trim();
    const label = trimmed === '' ? undefined : trimmed;

    return this.versionRepository.create({
      id: randomUUID(),
      projectId: project.id,
      versionNumber: (latest?.versionNumber ?? 0) + 1,
      changeLabel: label ?? `Retouche manuelle depuis v${base.versionNumber}`,
      parametersJson: base.parametersJson,
      generatedByAI: false,
      pieces: pieces.map((p) => ({
        name: p.name,
        dimensionsJson: p.dimensionsJson,
        fabricRecommendation: p.fabricRecommendation ?? null,
        quantity: p.quantity,
        grainlineJson: p.grainlineJson ?? null,
        seamAllowanceCm: p.seamAllowanceCm ?? null,
        notchesJson: p.notchesJson ?? null,
      })),
    });
  }
}
