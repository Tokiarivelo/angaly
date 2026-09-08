/** French long date ("12 octobre 2024") — correct French typography, not the mockup's decorative capitalized month. */
export function formatArticleDate(publishedAt: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(publishedAt));
}
