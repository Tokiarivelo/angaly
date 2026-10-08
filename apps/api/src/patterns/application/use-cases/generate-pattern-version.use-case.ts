import {
  BadRequestException,
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
import {
  AiUsage,
  validateMeasurementValues,
  validatePatternExtParameters,
  type AiProviderId,
  type InspirationAnalysisSnapshot,
} from '@angaly/types';
import { AiProviderResolverService } from '../../../ai-inference/application/services/ai-provider-resolver.service';
import { InspirationParametersService } from '../services/inspiration-parameters.service';
import { SuggestPatternParametersUseCase } from '../../../ai-inference/application/use-cases/suggest-pattern-parameters.use-case';
import { RecordPatternLearningUseCase } from '../../../ai-inference/application/use-cases/record-pattern-learning.use-case';
import { EstimateMissingMeasurementsUseCase } from '../../../ai-inference/application/use-cases/estimate-missing-measurements.use-case';
import { GeneratePatternVersionDto } from '../dtos/generate-pattern-version.dto';
import { type GarmentType, type PatternParameters, PatternEngineValidationError } from '@angaly/pattern-engine';

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
    private readonly providerResolver: AiProviderResolverService,
    private readonly recordPatternLearning: RecordPatternLearningUseCase,
    private readonly inspirationParameters: InspirationParametersService,
    private readonly suggestPatternParameters: SuggestPatternParametersUseCase,
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

    // The customer's confirmed choices win; the stored photo analysis fills the gaps with the most
    // fitting engine values (then, best-effort, the AI fills what is still empty).
    const analysis = project.inspirationAnalysisJson;
    const merged = this.inspirationParameters.merge(
      { cutType: project.cutType, details: (project.detailsJson as Record<string, string>) ?? {} },
      analysis,
    );
    const aiFilledKeys = await this.fillMissingDetailsWithAi(
      merged,
      { garmentType, occasion: project.occasion, style: project.style },
      analysis,
      dto?.aiProvider,
    );

    // Extended inputs (ease, fullness, lengths): re-validated here too, so a row written by an older
    // client or by hand can never push an out-of-range value into the engine. Absent = defaults.
    const ext = validatePatternExtParameters(project.parametersExtJson).value;

    const parameters: PatternParameters = {
      garmentType,
      cutType: merged.cutType,
      style: project.style ?? null,
      details: merged.details,
      ...(ext.ease ? { ease: ext.ease } : {}),
      ...(ext.fullness ? { fullness: ext.fullness } : {}),
      ...(ext.lengths ? { lengths: ext.lengths } : {}),
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

      // The user's model choice (if usable) wins over the atelier default routing.
      const selectedProvider = await this.providerResolver.resolveSelected(
        dto?.aiProvider,
        AiUsage.MEASUREMENT_ESTIMATION,
      );

      const { estimation } = await this.estimateMissingMeasurementsUseCase.execute({
        garmentType,
        gender: null,
        knownMeasurements: measurements,
        requiredKeys: error.missingMeasurementKeys,
        ...(selectedProvider ? { provider: selectedProvider } : {}),
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

    // Les avertissements propres à une règle (ex. bloc générique « Autre ») viennent du moteur.
    const warnings = [...generationResult.warnings];
    const draping = this.inspirationParameters.drapingAdvice(analysis?.profile);
    if (draping) warnings.push(draping.warning);

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
        warnings,
        inspiration: analysis
          ? {
              observations: analysis.features,
              presentation: analysis.profile?.presentation ?? null,
              constructionMethod: analysis.profile?.constructionMethod ?? 'FLAT_PATTERN',
              constructionNotes: analysis.profile?.constructionNotes ?? null,
              detailKeysFromPhoto: merged.fromPhotoKeys,
              detailKeysFromAi: aiFilledKeys,
            }
          : null,
        metadata: generationResult.metadata,
      },
      generatedByAI: estimatedMeasurementKeys.length > 0,
      pieces: piecesData,
    });

    // Mettre à jour le statut du projet
    await this.projectRepository.update(projectId, {
      status: 'GENERATED',
    });

    // Learning loop (best-effort): remember what was actually built for similar future projects.
    await this.recordPatternLearning.recordGenerated({
      patternProjectId: projectId,
      garmentType,
      occasion: project.occasion,
      style: project.style,
      cutType: parameters.cutType,
      details: parameters.details,
      inspirationMediaId: project.inspirationMediaId,
    });

    return version;
  }

  /**
   * Best-effort: asks the configured AI to propose the detail groups still empty, using the photo
   * observations as text (no image tokens). Values are validated; the customer's choices never change.
   */
  private async fillMissingDetailsWithAi(
    merged: { cutType: string; details: Record<string, string> },
    base: { garmentType: string; occasion: string | null; style: string | null },
    analysis: InspirationAnalysisSnapshot | null,
    aiProvider: AiProviderId | undefined,
  ): Promise<string[]> {
    if (!analysis || Object.keys(analysis.features).length === 0) return [];
    if (this.inspirationParameters.missingGroups(merged.details).length === 0) return [];
    try {
      const provider = await this.providerResolver.resolveSelected(aiProvider, AiUsage.PATTERN_SUGGESTION);
      const { suggestion } = await this.suggestPatternParameters.execute({
        garmentType: base.garmentType,
        occasion: base.occasion,
        style: base.style,
        measurements: {},
        inspirationImageUrl: null,
        inspirationFeatures: analysis.features,
        ...(provider ? { provider } : {}),
      });
      if (suggestion.modelVersion.startsWith('fallback')) return [];
      const { details, acceptedKeys } = this.inspirationParameters.acceptSuggestedDetails(
        merged.details,
        suggestion.suggestedDetails,
      );
      Object.assign(merged.details, details);
      return acceptedKeys;
    } catch {
      return [];
    }
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

    const manual = dto?.measurements ?? {};
    const { issues } = validateMeasurementValues(manual);
    if (issues.length > 0) {
      throw new BadRequestException({
        message: 'Mesures invalides',
        errors: issues.map((issue) => issue.message),
      });
    }
    return { ...profileMeasurements, ...manual };
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
