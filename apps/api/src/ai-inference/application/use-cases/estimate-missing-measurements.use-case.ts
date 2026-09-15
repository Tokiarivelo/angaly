import { Injectable } from '@nestjs/common';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { PatternMeasurementEstimationRequest, PatternMeasurementEstimationResponse } from '@angaly/types';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.vo';
import { GetAiModelSettingUseCase } from '../../../admin-ai-settings/application/use-cases/get-ai-model-setting.use-case';

@Injectable()
export class EstimateMissingMeasurementsUseCase {
  constructor(
    private readonly aiClient: AiServiceHttpClient,
    private readonly getAiModelSetting: GetAiModelSettingUseCase,
  ) {}

  async execute(request: PatternMeasurementEstimationRequest): Promise<{
    estimation: PatternMeasurementEstimationResponse;
    isIndicativeOnly: boolean;
  }> {
    // Admin-controlled (docs/features/ai-model-settings.md) — a caller may
    // already pass modelPreference explicitly (tests, future callers); the
    // stored setting is only the default.
    const modelPreference = request.modelPreference ?? (await this.getAiModelSetting.execute()).measurementModel;

    const estimation = await this.aiClient.estimateMissingMeasurements({
      ...request,
      modelPreference,
    });

    const confidence = new ConfidenceScore(estimation.confidence);
    const isIndicativeOnly =
      confidence.isIndicativeOnly() || estimation.modelVersion.includes('fallback');

    return { estimation, isIndicativeOnly };
  }
}
