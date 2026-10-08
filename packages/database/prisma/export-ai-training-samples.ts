/**
 * Exports collected external-model pairs as JSONL for training ANGALY's local model.
 * Usage: pnpm --filter @angaly/database db:export:ai-training [out.jsonl] [--confirmed-only]
 * One line per sample: { task, imageUrl, label, weakLabel, status, providerId, modelVersion }.
 * `label` is the customer's final choice (human-validated) when known, else the external model's
 * answer (`weakLabel`). Prefer --confirmed-only for evaluation sets.
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const confirmedOnly = args.includes('--confirmed-only');
  const out = args.find((arg) => !arg.startsWith('--')) ?? 'ai-training-samples.jsonl';

  const rows = await prisma.aiTrainingSample.findMany({
    where: confirmedOnly ? { status: 'HUMAN_CONFIRMED' } : { status: { not: 'EXCLUDED' } },
    orderBy: { createdAt: 'asc' },
  });

  const lines = rows.map((row) =>
    JSON.stringify({
      task: row.task,
      imageUrl: row.imageUrl,
      label: row.humanLabel ?? (row.output as { profile?: unknown }).profile ?? null,
      weakLabel: (row.output as { profile?: unknown }).profile ?? null,
      status: row.status,
      providerId: row.providerId,
      modelVersion: row.modelVersion,
      confidence: row.confidence,
    }),
  );
  writeFileSync(out, lines.join('\n') + (lines.length ? '\n' : ''));
  console.log(`${lines.length} sample(s) written to ${out}`);
}

main().finally(() => prisma.$disconnect());
