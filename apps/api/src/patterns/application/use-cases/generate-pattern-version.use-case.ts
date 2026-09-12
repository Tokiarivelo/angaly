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
import { GeneratePatternPiecesUseCase } from '../../../pattern-engine/application/use-cases/generate-pattern-pieces.use-case';
import { GeneratePatternVersionDto } from '../dtos/generate-pattern-version.dto';
import type { GarmentType } from '@angaly/pattern-engine';

@Injectable()
export class GeneratePatternVersionUseCase {
  constructor(
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
    @Inject(PATTERN_VERSION_REPOSITORY)
    private readonly versionRepository: IPatternVersionRepository,
    private readonly generatePatternPiecesUseCase: GeneratePatternPiecesUseCase,
  ) {}

  async execute(
    projectId: string,
    customerId: string,
    dto?: GeneratePatternVersionDto,
  ): Promise<PatternVersionEntity> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Projet de patron introuvable: ${projectId}`);
    }

    if (project.customerId !== customerId) {
      throw new ForbiddenException('Vous n’avez pas accès à ce projet de patron.');
    }

    // Determine normalized garment type
    let garmentType: GarmentType = 'ROBE';
    const rawType = project.garmentType.toUpperCase();
    if (rawType.includes('JUPE')) garmentType = 'JUPE';
    else if (rawType.includes('MARIEE')) garmentType = 'ROBE_MARIEE';
    else if (rawType.includes('PANTALON')) garmentType = 'PANTALON';
    else if (rawType.includes('VESTE')) garmentType = 'VESTE';
    else if (rawType.includes('COSTUME')) garmentType = 'COSTUME';
    else if (rawType.includes('CHEMISE')) garmentType = 'CHEMISE';

    // Mesures de travail (avec fallback standard pour la confection sur mesure)
    const measurements: Record<string, number> = {
      TOUR_POITRINE: 90,
      TOUR_TAILLE: 70,
      TOUR_BASSIN: 95,
      LONGUEUR_DOS: 40,
      LONGUEUR_BRAS: 60,
      CARRURE_DOS: 38,
      ...(dto?.measurements ?? {}),
    };

    const parameters = {
      garmentType,
      cutType: project.cutType ?? 'DROITE',
      style: project.style ?? null,
      details: (project.detailsJson as Record<string, string>) ?? {},
    };

    // Calcul géométrique déterministe via le pattern-engine
    const generationResult = await this.generatePatternPiecesUseCase.execute(
      parameters,
      measurements,
    );

    // Récupérer le dernier numéro de version
    const latestVersion = await this.versionRepository.findLatestByProjectId(projectId);
    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

    const versionId = randomUUID();
    const piecesData = generationResult.pieces.map((piece) => ({
      name: piece.name,
      dimensionsJson: { outlineMm: piece.outlineMm },
      fabricRecommendation: piece.fabricRecommendation,
      quantity: piece.quantity,
      grainlineJson: piece.grainline ? { ...piece.grainline } : null,
      seamAllowanceCm: piece.seamAllowanceMm ? piece.seamAllowanceMm / 10 : 1.0,
      notchesJson: piece.notches ? piece.notches.map((n) => ({ ...n })) : null,
    }));

    const version = await this.versionRepository.create({
      id: versionId,
      projectId,
      versionNumber: nextVersionNumber,
      changeLabel: `Génération géométrique v${nextVersionNumber}`,
      parametersJson: {
        parameters,
        measurements,
        metadata: generationResult.metadata,
      },
      generatedByAI: false,
      pieces: piecesData,
    });

    // Mettre à jour le statut du projet
    await this.projectRepository.update(projectId, {
      status: 'GENERATED',
    });

    return version;
  }
}
