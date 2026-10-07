import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import type {
  DownscaledInspirationImage,
  IInspirationImagePreprocessor,
} from '../../domain/services/inspiration-image-preprocessor.service';
import { validateProviderBaseUrl } from '../../../admin-ai-settings/application/utils/ssrf-validator';

const DOWNLOAD_TIMEOUT_MS = 8000;
const DEFAULT_MAX_PX = 1024;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

@Injectable()
export class SharpInspirationImagePreprocessor implements IInspirationImagePreprocessor {
  private readonly maxPx: number;
  private readonly maxBytes: number;

  constructor(config: ConfigService) {
    this.maxPx = Number(config.get('INSPIRATION_IMAGE_MAX_PX') ?? DEFAULT_MAX_PX);
    this.maxBytes = Number(config.get('INSPIRATION_IMAGE_MAX_BYTES') ?? DEFAULT_MAX_BYTES);
  }

  async fetchOriginal(url: string): Promise<Buffer> {
    validateProviderBaseUrl(url);

    const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
    if (!response.ok) {
      throw new Error(`Téléchargement de l’image impossible (HTTP ${response.status}).`);
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Le fichier n’est pas une image (${contentType || 'type inconnu'}).`);
    }
    const declared = Number(response.headers.get('content-length') ?? 0);
    if (declared > this.maxBytes) {
      throw new Error('Image trop volumineuse.');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > this.maxBytes) {
      throw new Error('Image trop volumineuse.');
    }
    return buffer;
  }

  async downscale(original: Buffer): Promise<DownscaledInspirationImage> {
    // JPEG for maximum compatibility across vision providers (incl. Ollama); token cost depends on
    // pixel dimensions, not on the encoding.
    const { data, info } = await sharp(original, { failOn: 'error' })
      .rotate()
      .resize({ width: this.maxPx, height: this.maxPx, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    return { buffer: data, mimeType: 'image/jpeg', width: info.width, height: info.height };
  }
}
