import { BadRequestException } from '@nestjs/common';
import { validateProviderBaseUrl } from '../../application/utils/ssrf-validator';

describe('validateProviderBaseUrl (SSRF protection)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('accepts valid https URLs', () => {
    expect(() => validateProviderBaseUrl('https://api.openai.com/v1')).not.toThrow();
    expect(() => validateProviderBaseUrl('https://api.mistral.ai/v1')).not.toThrow();
    expect(() => validateProviderBaseUrl('https://openrouter.ai/api/v1')).not.toThrow();
  });

  it('accepts localhost http in development', () => {
    process.env.NODE_ENV = 'development';
    expect(() => validateProviderBaseUrl('http://localhost:11434/v1')).not.toThrow();
    expect(() => validateProviderBaseUrl('http://127.0.0.1:8000')).not.toThrow();
  });

  it('rejects cloud metadata IPs', () => {
    expect(() => validateProviderBaseUrl('http://169.254.169.254/latest/meta-data')).toThrow(
      BadRequestException,
    );
    expect(() => validateProviderBaseUrl('https://metadata.google.internal/computeMetadata/v1')).toThrow(
      BadRequestException,
    );
  });

  it('rejects non-http(s) protocols', () => {
    expect(() => validateProviderBaseUrl('ftp://example.com/api')).toThrow(BadRequestException);
    expect(() => validateProviderBaseUrl('file:///etc/passwd')).toThrow(BadRequestException);
    expect(() => validateProviderBaseUrl('javascript:alert(1)')).toThrow(BadRequestException);
  });

  it('rejects private IPs in production', () => {
    process.env.NODE_ENV = 'production';
    expect(() => validateProviderBaseUrl('https://192.168.1.50/v1')).toThrow(
      BadRequestException,
    );
    expect(() => validateProviderBaseUrl('https://10.0.0.1/v1')).toThrow(
      BadRequestException,
    );
  });
});
