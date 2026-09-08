const WORDS_PER_MINUTE = 200;

/** Estimated reading time — pure computation on `content`, no Prisma field needed. */
export function estimateReadingTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}
