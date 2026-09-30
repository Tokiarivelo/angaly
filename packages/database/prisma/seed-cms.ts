/**
 * Inserts the default CMS sections (create-only — never overwrites an edited row).
 * Run against an existing database: `pnpm --filter @angaly/database db:seed:cms`.
 */
import { PrismaClient } from '../generated/client';
import { seedCmsDefaults } from './cms-defaults';

const prisma = new PrismaClient();

seedCmsDefaults(prisma)
  .then(({ created, skipped }) => console.log(`✅ CMS defaults: ${created} créées, ${skipped} déjà présentes`))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
