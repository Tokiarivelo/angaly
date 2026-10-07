import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import type { ISecretCipher } from '../../domain/services/secret-cipher.service';

@Injectable()
export class AesGcmSecretCipher implements ISecretCipher {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12; // 96 bits recommended for GCM

  private getKey(): Buffer {
    const rawKey = process.env.AI_KEYS_ENCRYPTION_KEY;
    if (!rawKey) {
      throw new Error(
        'AI_KEYS_ENCRYPTION_KEY environment variable is not defined. Please configure a 32-byte base64 key.',
      );
    }

    const keyBuffer = Buffer.from(rawKey, 'base64');
    if (keyBuffer.length !== 32) {
      throw new Error(
        `AI_KEYS_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${keyBuffer.length} bytes).`,
      );
    }

    return keyBuffer;
  }

  async encrypt(plainText: string): Promise<string> {
    const key = this.getKey();
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Format: iv.tag.ciphertext (all base64)
    return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  async decrypt(cipherText: string): Promise<string> {
    const key = this.getKey();
    const parts = cipherText.split('.');

    if (parts.length !== 3) {
      throw new Error('Invalid cipher text format. Expected iv.tag.ciphertext (base64).');
    }

    const [ivB64, tagB64, encryptedB64] = parts;
    const iv = Buffer.from(ivB64!, 'base64');
    const tag = Buffer.from(tagB64!, 'base64');
    const encrypted = Buffer.from(encryptedB64!, 'base64');

    if (iv.length !== this.ivLength) {
      throw new Error(`Invalid IV length: expected ${this.ivLength} bytes.`);
    }

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
