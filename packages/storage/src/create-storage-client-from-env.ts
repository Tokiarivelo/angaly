import { StorageClient } from './storage-client';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Reads MINIO_* variables (see .env.example) and returns a ready-to-use StorageClient. */
export function createStorageClientFromEnv(): StorageClient {
  return new StorageClient({
    endPoint: requireEnv('MINIO_ENDPOINT'),
    port: Number(process.env['MINIO_PORT'] ?? 9000),
    useSSL: process.env['MINIO_USE_SSL'] === 'true',
    accessKey: requireEnv('MINIO_ACCESS_KEY'),
    secretKey: requireEnv('MINIO_SECRET_KEY'),
    publicUrl: requireEnv('MINIO_PUBLIC_URL'),
  });
}
