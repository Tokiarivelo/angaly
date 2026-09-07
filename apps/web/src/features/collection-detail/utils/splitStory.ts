/**
 * `Collection.story` is a single `String?` field (docs/pages/collection-detail.md
 * "Points d'attention") — the real Stitch screen shows 2 paragraphs, reconstructed here by
 * splitting on blank lines. Falls back to `description` when there's no story yet.
 */
export function splitStory(story: string | null, description: string | null): string[] {
  const text = story ?? description ?? '';
  if (!text.trim()) {
    return [];
  }
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}
