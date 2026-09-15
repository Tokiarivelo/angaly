import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
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
import { PatternVersionEntity } from '../../domain/entities/pattern-version.entity';
import { GeneratePatternPiecesUseCase } from '../../../pattern-engine/application/use-cases/generate-pattern-pieces.use-case';
import { GetMeasurementProfileUseCase } from '../../../measurements/application/use-cases/get-measurement-profile.use-case';
import { EstimateMissingMeasurementsUseCase } from '../../../ai-inference/application/use-cases/estimate-missing-measurements.use-case';
import { GeneratePatternVersionDto } from '../dtos/generate-pattern-version.dto';
import { type GarmentType, PatternEngineValidationError } from '@angaly/pattern-engine';

const KNOWN_GARMENT_TYPES: readonly GarmentType[] = [
  'ROBE',
  'JUPE',
  'PANTALON',
  'VESTE',
  'COSTUME',
  'CHEMISE',
  'ROBE_MARIEE',
  'AUTRE',
];

@Injectable()
export class GeneratePatternVersionUseCase {
  constructor(
    @Inject(PATTERN_PROJECT_REPOSITORY)
    private readonly projectRepository: IPatternProjectRepository,
    @Inject(PATTERN_VERSION_REPOSITORY)
    private readonly versionRepository: IPatternVersionRepository,
    private readonly generatePatternPiecesUseCase: GeneratePatternPiecesUseCase,
    private readonly getMeasurementProfileUseCase: GetMeasurementProfileUseCase,
    private readonly estimateMissingMeasurementsUseCase: EstimateMissingMeasurementsUseCase,
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

    const garmentType = this.resolveGarmentType(project.garmentType);

    let measurements = await this.buildInitialMeasurements(
      project.measurementProfileId,
      project.customerId,
      dto,
    );

    const parameters = {
      garmentType,
      cutType: project.cutType ?? 'DROITE',
      style: project.style ?? null,
      details: (project.detailsJson as Record<string, string>) ?? {},
    };

    // Calcul géométrique déterministe via le pattern-engine — aucune valeur
    // par défaut devinée ici : si des mesures requises manquent, on tente une
    // estimation IA explicite (marquée comme telle) avant de réessayer une
    // seule fois ; sinon on rejette (règle absolue #19/pattern-engine.provider).
    let estimatedMeasurementKeys: string[] = [];
    let generationResult;
    try {
      generationResult = await this.generatePatternPiecesUseCase.execute(parameters, measurements);
    } catch (error) {
      if (!(error instanceof PatternEngineValidationError)) {
        throw error;
      }
      if (error.missingMeasurementKeys.length === 0) {
        throw new UnprocessableEntityException(error.message);
      }

      const { estimation } = await this.estimateMissingMeasurementsUseCase.execute({
        garmentType,
        gender: null,
        knownMeasurements: measurements,
        requiredKeys: error.missingMeasurementKeys,
      });

      if (Object.keys(estimation.estimatedMeasurements).length === 0) {
        throw new UnprocessableEntityException(error.message);
      }

      measurements = { ...measurements, ...estimation.estimatedMeasurements };
      estimatedMeasurementKeys = estimation.estimatedKeys;

      try {
        generationResult = await this.generatePatternPiecesUseCase.execute(parameters, measurements);
      } catch (retryError) {
        if (retryError instanceof PatternEngineValidationError) {
          throw new UnprocessableEntityException(retryError.message);
        }
        throw retryError;
      }
    }

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
        estimatedMeasurementKeys,
        metadata: generationResult.metadata,
      },
      generatedByAI: estimatedMeasurementKeys.length > 0,
      pieces: piecesData,
    });

    // Mettre à jour le statut du projet
    await this.projectRepository.update(projectId, {
      status: 'GENERATED',
    });

    return version;
  }

  /**
   * Fusionne les mesures dans l'ordre : profil de mesures lié au projet, puis
   * mesures manuelles transmises pour cette génération (celles-ci écrasent le
   * profil). Aucune valeur par défaut codée en dur : ce qui manque encore est
   * traité par `execute()` via l'estimation IA.
   */
  private async buildInitialMeasurements(
    measurementProfileId: string | null,
    customerId: string,
    dto?: GeneratePatternVersionDto,
  ): Promise<Record<string, number>> {
    let profileMeasurements: Record<string, number> = {};

    if (measurementProfileId) {
      try {
        const profile = await this.getMeasurementProfileUseCase.execute(
          measurementProfileId,
          customerId,
        );
        profileMeasurements = Object.fromEntries(profile.values);
      } catch {
        // Profil introuvable/inaccessible : on continue avec les mesures manuelles seules.
      }
    }

    return { ...profileMeasurements, ...(dto?.measurements ?? {}) };
  }

  private resolveGarmentType(rawType: string): GarmentType {
    const normalized = rawType.trim().toUpperCase();
    if ((KNOWN_GARMENT_TYPES as string[]).includes(normalized)) {
      return normalized as GarmentType;
    }
    throw new UnprocessableEntityException(
      `Type de vêtement non reconnu pour la génération de patron: "${rawType}"`,
    );
  }
}
