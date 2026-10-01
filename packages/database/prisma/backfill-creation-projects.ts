/**
 * Creates a CreationProject for every ACCEPTED quote that has none yet (idempotent).
 * Mirrors CreateCreationProjectFromQuoteUseCase in apps/api.
 * Run: `pnpm --filter @angaly/database db:backfill:creation-projects`.
 */
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();
const TITLE_MAX_LENGTH = 120;

async function backfill(): Promise<{ created: number; skipped: number }> {
  const quotes = await prisma.quote.findMany({
    where: { status: 'ACCEPTED' },
    orderBy: { createdAt: 'asc' },
  });
  const existing = await prisma.creationProject.findMany({
    where: { quoteId: { not: null } },
    select: { quoteId: true },
  });
  const alreadyLinked = new Set(existing.map((project) => project.quoteId));

  let created = 0;
  for (const quote of quotes) {
    if (alreadyLinked.has(quote.id)) continue;
    const text = quote.description.trim();
    const truncated = text.length > TITLE_MAX_LENGTH;
    await prisma.creationProject.create({
      data: {
        reference: `CRP-${new Date().getFullYear()}-${randomBytes(6).toString('base64url')}`,
        customerId: quote.customerId,
        creationId: quote.creationId,
        quoteId: quote.id,
        title: text ? text.slice(0, TITLE_MAX_LENGTH) : 'Création sur mesure',
        description: truncated ? text : null,
      },
    });
    created += 1;
  }
  return { created, skipped: quotes.length - created };
}

backfill()
  .then(({ created, skipped }) =>
    console.log(`✅ Projets de création: ${created} créés, ${skipped} déjà présents`),
  )
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
