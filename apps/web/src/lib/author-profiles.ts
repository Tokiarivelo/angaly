/**
 * `BlogPostAuthorDto` only carries `{id, email}` — `User` is an auth identity model, not an
 * editorial profile (no display name/role/bio/photo field — see
 * docs/pages/journal-article.md "Points d'attention"). Real published articles all show a
 * named, specific persona in the Stitch mockups (journal-liste's featured card and this
 * page's header/AuthorBox both show "Mme. Fanja, Maître Tailleur"), so Phase 1 keeps a
 * small editorial profile lookup keyed by email — seed data outside the Prisma model, per
 * the doc's own guidance, rather than fabricating a name from the raw address. Any author
 * email not in this table falls back to a generic byline instead of guessing.
 */
export interface AuthorProfile {
  displayName: string;
  role: string | null;
  bio: string | null;
  photoUrl: string | null;
}

const DEFAULT_PROFILE: AuthorProfile = {
  displayName: 'La Rédaction ANGALY',
  role: null,
  bio: null,
  photoUrl: null,
};

const AUTHOR_PROFILES: Record<string, AuthorProfile> = {
  'admin@angaly.mg': {
    displayName: 'Mme. Fanja',
    role: 'Maître Tailleur, ANGALY',
    bio: "Avec plus de 20 ans d'expérience dans la haute couture, Mme. Fanja dirige l'atelier de création sur mesure d'ANGALY. Sa passion pour les coupes architecturales et les finitions manuelles minutieuses a fait de ses créations la référence de l'élégance à Madagascar.",
    photoUrl: null,
  },
};

export function getAuthorProfile(author: { email: string }): AuthorProfile {
  return AUTHOR_PROFILES[author.email] ?? DEFAULT_PROFILE;
}
