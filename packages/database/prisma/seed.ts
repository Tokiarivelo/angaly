import * as bcrypt from 'bcrypt';

import { CategoryKind, PrismaClient, Role } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ANGALY database (foundation)...');

  const adminPasswordHash = await bcrypt.hash('Admin@Angaly2026!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@angaly.mg' },
    update: {},
    create: {
      email: 'admin@angaly.mg',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user ready (admin@angaly.mg)');

  const weekdayHours = { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] };
  // Shape validated by apps/api/src/ateliers/domain/value-objects/opening-hours.vo.ts
  // (mirrors AtelierOpeningHours in @angaly/types — keep both in sync).
  const atelierData = {
    name: 'Atelier Antananarivo Centre',
    address: 'À compléter',
    city: 'Antananarivo',
    openingHoursJson: {
      monday: weekdayHours,
      tuesday: weekdayHours,
      wednesday: weekdayHours,
      thursday: weekdayHours,
      friday: weekdayHours,
      saturday: { isOpen: true, slots: [{ open: '09:00', close: '13:00' }] },
      sunday: { isOpen: false, slots: [] },
    },
    servicesJson: ['Essayage', 'Consultation', 'Retouche'],
  };
  await prisma.atelier.upsert({
    where: { slug: 'antananarivo-centre' },
    update: atelierData,
    create: { slug: 'antananarivo-centre', ...atelierData },
  });
  console.log('✅ Atelier principal créé');

  const categories = [
    { slug: 'robes-de-mariee', name: 'Robes de mariée', kind: CategoryKind.CREATION },
    { slug: 'costumes-homme', name: 'Costumes homme', kind: CategoryKind.CREATION },
    { slug: 'robes-de-soiree', name: 'Robes de soirée', kind: CategoryKind.CREATION },
    { slug: 'pret-a-porter', name: 'Prêt-à-porter', kind: CategoryKind.PRODUCT },
    { slug: 'conseils-mode', name: 'Conseils mode', kind: CategoryKind.BLOG },
  ];
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`✅ ${categories.length} catégories créées`);

  console.log('🌱 Seed terminé — jeu de données étendu à ajouter Phase 1.');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
