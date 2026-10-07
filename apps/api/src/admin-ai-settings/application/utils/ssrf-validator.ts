import { BadRequestException } from '@nestjs/common';

/**
 * Validates a base URL to protect against Server-Side Request Forgery (SSRF).
 * Specified in docs/features/ai-providers.md §6.
 */
export function validateProviderBaseUrl(baseUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new BadRequestException(`URL de base invalide : "${baseUrl}".`);
  }

  const protocol = parsed.protocol.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();

  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]';

  // Allowed private hosts override via env var
  const allowedHosts = (process.env.AI_ALLOWED_PRIVATE_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const isExplicitlyAllowed = allowedHosts.includes(hostname);

  if (protocol === 'http:') {
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isLocalhost && !isExplicitlyAllowed && !isDev) {
      throw new BadRequestException(
        'Seules les URLs HTTPS sécurisées sont autorisées pour les fournisseurs distants (HTTP réservé à localhost en développement).',
      );
    }
  } else if (protocol !== 'https:') {
    throw new BadRequestException(`Protocole non supporté "${protocol}". Seuls HTTPS (et HTTP pour localhost) sont acceptés.`);
  }

  // Cloud metadata services protection
  if (
    hostname === '169.254.169.254' ||
    hostname.startsWith('169.254.') ||
    hostname.includes('metadata.google.internal') ||
    hostname.includes('instance-data')
  ) {
    throw new BadRequestException('Accès aux adresses de métadonnées d’infrastructure strictement interdit.');
  }

  // Disallow common private ranges in production unless explicitly whitelisted
  if (process.env.NODE_ENV === 'production' && !isExplicitlyAllowed) {
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      throw new BadRequestException('Accès aux réseaux privés internes non autorisé.');
    }
  }
}
