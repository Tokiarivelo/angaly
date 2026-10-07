import { Injectable } from '@nestjs/common';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import {
  AiProviderId,
  AiUsage,
  PatternMeasurementEstimationRequest,
  PatternMeasurementEstimationResponse,
} from '@angaly/types';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.vo';
import { AiProviderResolverService } from '../services/ai-provider-resolver.service';

@Injectable()
export class EstimateMissingMeasurementsUseCase {
  constructor(
    private readonly aiClient: AiServiceHttpClient,
    private readonly providerResolver: AiProviderResolverService,
  ) {}

  async execute(request: PatternMeasurementEstimationRequest): Promise<{
    estimation: PatternMeasurementEstimationResponse;
    isIndicativeOnly: boolean;
  }> {
    let credentials = request.provider;
    if (!credentials) {
      credentials = await this.providerResolver.resolveCredentials(AiUsage.MEASUREMENT_ESTIMATION);
    }

    const modelPreference =
      request.modelPreference ??
      (credentials?.provider === AiProviderId.LOCAL_STATISTICAL ? 'LOCAL_STATISTICAL' : 'GEMINI');

    const estimation = await this.aiClient.estimateMissingMeasurements({
      ...request,
      provider: credentials,
      modelPreference,
    });

    const confidence = new ConfidenceScore(estimation.confidence);
    const isIndicativeOnly =
      confidence.isIndicativeOnly() || estimation.modelVersion.includes('fallback');

    return { estimation, isIndicativeOnly };
  }
}
