import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AvailableModelsResponse,
  InspirationAnalysisRequest,
  InspirationAnalysisResponse,
  PatternAiSuggestionRequest,
  PatternAiSuggestionResponse,
  PatternMeasurementEstimationRequest,
  PatternMeasurementEstimationResponse,
} from '@angaly/types';

@Injectable()
export class AiServiceHttpClient {
  private readonly logger = new Logger(AiServiceHttpClient.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('AI_SERVICE_URL') ?? 'http://localhost:8001';
    this.timeoutMs = this.config.get<number>('AI_SERVICE_TIMEOUT_MS') ?? 5000;
  }

  async suggestPatternParameters(request: PatternAiSuggestionRequest): Promise<PatternAiSuggestionResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/v1/pattern/suggest-parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI service responded with status ${response.status}`);
      }

      return await response.json() as PatternAiSuggestionResponse;
    } catch (error) {
      this.logger.error(`Failed to reach AI service: ${error instanceof Error ? error.message : String(error)}`);
      // Dégradation gracieuse en cas d'erreur ou timeout
      return {
        suggestedCutType: 'DROITE',
        suggestedDetails: {},
        detectedInspirationFeatures: null,
        confidence: 0,
        modelVersion: 'fallback-0.0.0',
      };
    }
  }

  async analyzeInspiration(request: InspirationAnalysisRequest): Promise<InspirationAnalysisResponse> {
    const startedAt = Date.now();
    const model = request.provider ? `${request.provider.provider}/${request.provider.model}` : 'default';
    this.logger.log(`ai-service analyze-inspiration → model=${model} imageKB=${Math.round(request.imageBase64.length * 0.75 / 1024)}`);
    try {
      const response = await fetch(`${this.baseUrl}/v1/pattern/analyze-inspiration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        // Vision calls are slower than text-only ones.
        signal: AbortSignal.timeout(Math.max(this.timeoutMs, 20000)),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`AI service responded with status ${response.status} ${body.slice(0, 300)}`);
      }

      const analysis = (await response.json()) as InspirationAnalysisResponse;
      const elapsed = Date.now() - startedAt;
      if (analysis.modelVersion.startsWith('fallback')) {
        this.logger.warn(
          `ai-service analyze-inspiration returned a FALLBACK after ${elapsed}ms (model=${model}) — see the ai-service log for the provider error`,
        );
      } else {
        this.logger.log(
          `ai-service analyze-inspiration ok in ${elapsed}ms model=${analysis.modelVersion} confidence=${analysis.confidence} garment=${analysis.profile?.isGarment ?? 'n/a'}`,
        );
      }
      return analysis;
    } catch (error) {
      this.logger.error(
        `Failed to analyze inspiration image after ${Date.now() - startedAt}ms (url=${this.baseUrl}, model=${model}): ${error instanceof Error ? error.message : String(error)}`,
      );
      return { features: {}, suggestedCutType: null, confidence: 0, modelVersion: 'fallback-0.0.0' };
    }
  }

  async sendMessageToAssistant(message: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/v1/chat/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI service responded with status ${response.status}`);
      }

      const data = (await response.json()) as { response: string };
      return data.response;
    } catch (error) {
      this.logger.error(`Failed to reach AI assistant: ${error instanceof Error ? error.message : String(error)}`);
      return "Bonjour ! Je suis l'assistant Angaly. Je rencontre une difficulté technique, réessayez dans un instant.";
    }
  }

  async estimateMissingMeasurements(
    request: PatternMeasurementEstimationRequest,
  ): Promise<PatternMeasurementEstimationResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/v1/pattern/estimate-measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI service responded with status ${response.status}`);
      }

      return (await response.json()) as PatternMeasurementEstimationResponse;
    } catch (error) {
      this.logger.error(`Failed to estimate missing measurements: ${error instanceof Error ? error.message : String(error)}`);
      return {
        estimatedMeasurements: {},
        estimatedKeys: [],
        confidence: 0,
        modelVersion: 'fallback-0.0.0',
      };
    }
  }

  async getAvailableModels(): Promise<AvailableModelsResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI service responded with status ${response.status}`);
      }

      return (await response.json()) as AvailableModelsResponse;
    } catch (error) {
      this.logger.error(`Failed to list available AI models: ${error instanceof Error ? error.message : String(error)}`);
      return { measurementEstimation: ['GEMINI'] };
    }
  }
}
