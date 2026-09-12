import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PatternAiSuggestionRequest, PatternAiSuggestionResponse } from '@angaly/types';

@Injectable()
export class AiServiceHttpClient {
  private readonly logger = new Logger(AiServiceHttpClient.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
    this.timeoutMs = this.config.get<number>('AI_SERVICE_TIMEOUT_MS') || 5000;
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

  async sendMessageToAssistant(_message: string): Promise<string> {
    // Placeholder - waiting for the Python AI service to implement this endpoint
    return "Bonjour ! Je suis l'assistant Angaly (version placeholder). Comment puis-je vous aider ?";
  }
}
