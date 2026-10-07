import { AesGcmSecretCipher } from '../../infrastructure/security/aes-gcm-secret-cipher';

describe('AesGcmSecretCipher', () => {
  const originalEnv = process.env.AI_KEYS_ENCRYPTION_KEY;
  // 32-byte key base64 encoded
  const testKey = Buffer.alloc(32, 7).toString('base64');

  beforeEach(() => {
    process.env.AI_KEYS_ENCRYPTION_KEY = testKey;
  });

  afterAll(() => {
    process.env.AI_KEYS_ENCRYPTION_KEY = originalEnv;
  });

  it('encrypts and decrypts text round-trip successfully', async () => {
    const cipher = new AesGcmSecretCipher();
    const plain = 'sk-ant-api03-ultra-secret-test-key-12345';

    const encrypted = await cipher.encrypt(plain);
    expect(encrypted).not.toBe(plain);
    expect(encrypted.split('.')).toHaveLength(3);

    const decrypted = await cipher.decrypt(encrypted);
    expect(decrypted).toBe(plain);
  });

  it('produces different ciphertexts for identical plaintexts (random IV)', async () => {
    const cipher = new AesGcmSecretCipher();
    const plain = 'constant-secret-key';

    const enc1 = await cipher.encrypt(plain);
    const enc2 = await cipher.encrypt(plain);

    expect(enc1).not.toBe(enc2);
    expect(await cipher.decrypt(enc1)).toBe(plain);
    expect(await cipher.decrypt(enc2)).toBe(plain);
  });

  it('throws an error if the authentication tag is tampered with', async () => {
    const cipher = new AesGcmSecretCipher();
    const plain = 'secret-tamper-check';
    const encrypted = await cipher.encrypt(plain);

    const parts = encrypted.split('.');
    // Alter the tag
    const corruptedTag = Buffer.from(parts[1]!, 'base64');
    corruptedTag[0] = (corruptedTag[0] ?? 0) ^ 0xff;
    parts[1] = corruptedTag.toString('base64');

    await expect(cipher.decrypt(parts.join('.'))).rejects.toThrow();
  });

  it('throws an error if the format is invalid', async () => {
    const cipher = new AesGcmSecretCipher();
    await expect(cipher.decrypt('invalid-format')).rejects.toThrow(
      'Invalid cipher text format',
    );
  });

  it('throws an error if AI_KEYS_ENCRYPTION_KEY is missing', async () => {
    delete process.env.AI_KEYS_ENCRYPTION_KEY;
    const cipher = new AesGcmSecretCipher();
    await expect(cipher.encrypt('test')).rejects.toThrow(
      'AI_KEYS_ENCRYPTION_KEY environment variable is not defined',
    );
  });

  it('throws an error if key length is not exactly 32 bytes', async () => {
    process.env.AI_KEYS_ENCRYPTION_KEY = Buffer.alloc(16).toString('base64');
    const cipher = new AesGcmSecretCipher();
    await expect(cipher.encrypt('test')).rejects.toThrow(
      'AI_KEYS_ENCRYPTION_KEY must decode to exactly 32 bytes',
    );
  });
});
