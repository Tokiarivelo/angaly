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

  await prisma.atelier.upsert({
    where: { slug: 'antananarivo-centre' },
    update: {},
    create: {
      slug: 'antananarivo-centre',
      name: 'Atelier Antananarivo Centre',
      address: 'À compléter',
      city: 'Antananarivo',
      openingHoursJson: {
        lundi_vendredi: '9h-18h',
        samedi: '9h-13h',
        dimanche: 'Fermé',
      },
    },
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
