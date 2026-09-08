import { describe, expect, it } from 'vitest';

import { getAuthorProfile } from '../author-profiles';

describe('getAuthorProfile', () => {
  it('resolves a known author email to its editorial profile', () => {
    const profile = getAuthorProfile({ email: 'admin@angaly.mg' });
    expect(profile.displayName).toBe('Mme. Fanja');
    expect(profile.role).toBe('Maître Tailleur, ANGALY');
    expect(profile.bio).not.toBeNull();
  });

  it('falls back to a generic profile for an unknown author email', () => {
    const profile = getAuthorProfile({ email: 'unknown@angaly.mg' });
    expect(profile.displayName).toBe('La Rédaction ANGALY');
    expect(profile.role).toBeNull();
    expect(profile.bio).toBeNull();
  });
});
