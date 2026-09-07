import { createStorageClientFromEnv, type StorageClient, type StorageBucketName } from '@angaly/storage';
import * as bcrypt from 'bcrypt';

import { CategoryKind, CreationAvailability, MediaEntityType, PrismaClient, Role } from '../generated/client';

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
    address: "12 Rue de l'Artisanat, Ankorondrano",
    city: 'Antananarivo',
    latitude: -18.8827,
    longitude: 47.5177,
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
  const atelier = await prisma.atelier.upsert({
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

  const categoryBySlug = new Map(
    (await prisma.category.findMany()).map((category) => [category.slug, category]),
  );
  const mariage = categoryBySlug.get('robes-de-mariee')!;
  const costumes = categoryBySlug.get('costumes-homme')!;
  const soiree = categoryBySlug.get('robes-de-soiree')!;

  // Collections first (creations reference them by id).
  const collectionEternelle = await prisma.collection.upsert({
    where: { slug: 'collection-eternelle' },
    update: {},
    create: {
      slug: 'collection-eternelle',
      name: 'Collection Éternelle',
      description: "Où l'artisanat rencontre l'immortalité. Une symphonie de textures et d'élégance intemporelle.",
      story:
        "Inspirée par l'architecture baroque et la pureté des lignes organiques, la Collection Éternelle redéfinit l'élégance contemporaine. Chaque pièce est un témoignage du dévouement de nos artisans, tissant ensemble tradition malgache et haute couture internationale.\n\nDes mois de broderie à la main, de sélection méticuleuse de soies sauvages et de cristaux précieux ont été nécessaires pour donner vie à cette vision. Ce n'est pas simplement une collection ; c'est un héritage cousu de fil d'or.",
      seasonYear: 2026,
      publishedAt: new Date('2026-02-01T00:00:00.000Z'),
    },
  });
  const collectionDentelle = await prisma.collection.upsert({
    where: { slug: 'lart-de-la-dentelle' },
    update: {},
    create: {
      slug: 'lart-de-la-dentelle',
      name: "L'Art de la Dentelle",
      description: 'Exploration minutieuse des dentelles traditionnelles fusionnées avec des coupes avant-gardistes.',
      story:
        'Chaque motif de dentelle raconte une histoire transmise de génération en génération dans nos ateliers. Cette collection célèbre la patience et la précision du travail à la main, où chaque fil trouve sa place dans une composition d’ensemble.',
      seasonYear: 2026,
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  });
  console.log('✅ 2 collections créées');

  const creations = [
    {
      slug: 'robe-eternelle',
      name: 'Robe Éternelle',
      categoryId: mariage.id,
      collectionId: collectionEternelle.id,
      description:
        "L'incarnation du raffinement intemporel. La Robe Éternelle marie la structure architecturale d'un bustier corseté à la légèreté d'une jupe en cascade. Chaque détail est pensé pour sublimer la silhouette avec une élégance souveraine, digne des plus grands ateliers de couture.",
      materials: 'Satin duchesse de soie, Dentelle de Calais-Caudry',
      techniques: "Broderie d'art à l'aiguille, incrustation de perles nacrées",
      availability: CreationAvailability.PIECE_UNIQUE,
      reproducible: false,
      isFeatured: true,
      featuredFrom: new Date('2026-02-10T00:00:00.000Z'),
      photo: '1682226335318-f1911fdef7c1',
      photoAlt: 'Robe Éternelle — vue principale',
    },
    {
      slug: 'romance-royale',
      name: 'Romance Royale',
      categoryId: mariage.id,
      collectionId: null,
      description: 'Tulle et broderies fines pour une silhouette de mariée résolument romantique.',
      materials: 'Tulle et broderies fines',
      techniques: null,
      availability: CreationAvailability.PIECE_UNIQUE,
      reproducible: false,
      isFeatured: false,
      featuredFrom: null,
      photo: '1583939003579-730e3918a45a',
      photoAlt: 'Romance Royale — robe de mariée',
    },
    {
      slug: 'signature-artisan',
      name: 'Signature Artisan',
      categoryId: costumes.id,
      collectionId: collectionEternelle.id,
      description: 'Le raffinement du costume masculin, cousu main dans nos ateliers pour une coupe irréprochable.',
      materials: 'Détails à la main',
      techniques: null,
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: true,
      featuredFrom: new Date('2026-01-20T00:00:00.000Z'),
      photo: '1507679799987-c73779587ccf',
      photoAlt: 'Signature Artisan — costume sur mesure',
    },
    {
      slug: 'le-dandy',
      name: 'Le Dandy',
      categoryId: costumes.id,
      collectionId: collectionDentelle.id,
      description: 'Un costume trois-pièces à carreaux, taillé dans une laine froide sur mesure.',
      materials: 'Laine froide sur mesure',
      techniques: null,
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: false,
      featuredFrom: null,
      photo: '1594938298603-c8148c4dae35',
      photoAlt: 'Le Dandy — costume trois-pièces',
    },
    {
      slug: 'tailleur-sur-mesure',
      name: 'Tailleur Sur Mesure',
      categoryId: costumes.id,
      collectionId: null,
      description: 'Le raffinement du costume masculin, cousu main dans nos ateliers pour une coupe irréprochable.',
      materials: null,
      techniques: null,
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: false,
      featuredFrom: null,
      photo: '1769868800959-533a3f907d60',
      photoAlt: 'Tailleur Sur Mesure — détail boutonnière',
    },
    {
      slug: 'nuit-opera',
      name: "Nuit d'Opéra",
      categoryId: soiree.id,
      collectionId: collectionEternelle.id,
      description: 'Soie fluide et accents champagne pour une soirée mémorable.',
      materials: 'Soie fluide et accents champagne',
      techniques: null,
      availability: CreationAvailability.PIECE_UNIQUE,
      reproducible: false,
      isFeatured: true,
      featuredFrom: new Date('2026-02-15T00:00:00.000Z'),
      photo: '1554735109-39c2ab93b0ce',
      photoAlt: "Nuit d'Opéra — robe de soirée",
    },
    {
      slug: 'robe-majeste',
      name: 'Robe Majesté',
      categoryId: soiree.id,
      collectionId: collectionDentelle.id,
      description: 'Une silhouette de soirée ornée de broderies précieuses.',
      materials: null,
      techniques: null,
      availability: CreationAvailability.PIECE_UNIQUE,
      reproducible: false,
      isFeatured: false,
      featuredFrom: null,
      photo: '1571908599407-cdb918ed83bf',
      photoAlt: 'Robe Majesté — robe de soirée ornée',
    },
  ];

  const createdCreations = new Map<string, { id: string }>();
  for (const { photo: _photo, photoAlt: _photoAlt, ...creationData } of creations) {
    const creation = await prisma.creation.upsert({
      where: { slug: creationData.slug },
      update: creationData,
      create: creationData,
    });
    createdCreations.set(creation.slug, creation);
  }
  console.log(`✅ ${creations.length} créations créées`);

  // --- Media (real free stock photos uploaded to MinIO) ---------------------
  // See docs/pages/*.md "Points d'attention" for the "no real photography yet"
  // caveat this resolves — free, verified Unsplash photos (plain
  // images.unsplash.com/photo-*, never the paid plus.unsplash.com tier),
  // downloaded once and re-hosted via @angaly/storage per .cursor/rules/009-storage-minio.mdc
  // (rule 21: all media through MinIO, never a bare external URL in the DB).
  const alreadySeeded = await prisma.media.findFirst({ where: { entityType: MediaEntityType.CREATION } });
  if (alreadySeeded) {
    console.log('↷ Médias déjà seedés — étape ignorée (idempotence). Voir prisma/seed.ts pour reseeder.');
  } else {
    try {
      const storage = createStorageClientFromEnv();
      await storage.ensureBuckets();

      for (const { slug, photo, photoAlt } of creations) {
        const creation = createdCreations.get(slug);
        if (!creation) continue;
        await attachPhoto(storage, 'creations', photo, photoAlt, MediaEntityType.CREATION, creation.id);
      }
      console.log('✅ Photos des créations téléchargées et hébergées sur MinIO');

      await attachPhoto(
        storage,
        'collections',
        '1682226335318-f1911fdef7c1',
        'Collection Éternelle — photo de couverture',
        MediaEntityType.COLLECTION,
        collectionEternelle.id,
      );
      await attachPhoto(
        storage,
        'collections',
        '1676893140066-df87af3bc566',
        "Collection Éternelle — détail d'atelier",
        MediaEntityType.COLLECTION,
        collectionEternelle.id,
        1,
      );
      await attachPhoto(
        storage,
        'collections',
        '1745091946873-92e0a0a7819c',
        "L'Art de la Dentelle — photo de couverture",
        MediaEntityType.COLLECTION,
        collectionDentelle.id,
      );
      console.log('✅ Photos des collections téléchargées et hébergées sur MinIO');

      await attachPhoto(
        storage,
        'ateliers',
        '1641293498376-139cfe50ff67',
        "L'atelier Antananarivo Centre",
        MediaEntityType.ATELIER,
        atelier.id,
      );
      console.log("✅ Photo de l'atelier téléchargée et hébergée sur MinIO");
    } catch (error) {
      console.warn(
        '⚠️  Seed média ignoré (MinIO ou réseau indisponible) — les pages afficheront des dégradés de substitution.',
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log('🌱 Seed terminé.');
}

async function downloadUnsplashPhoto(photoId: string): Promise<Buffer> {
  const response = await fetch(`https://images.unsplash.com/photo-${photoId}?w=1600&q=80&fm=jpg`);
  if (!response.ok) {
    throw new Error(`Échec du téléchargement de la photo Unsplash ${photoId} : ${String(response.status)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function attachPhoto(
  storage: StorageClient,
  bucket: StorageBucketName,
  photoId: string,
  altText: string,
  entityType: MediaEntityType,
  entityId: string,
  sortOrder = 0,
): Promise<void> {
  const buffer = await downloadUnsplashPhoto(photoId);
  const upload = await storage.uploadBuffer(bucket, buffer, {
    originalFilename: `${photoId}.jpg`,
    mimeType: 'image/jpeg',
    keyPrefix: entityId,
  });

  const relationField =
    entityType === MediaEntityType.CREATION
      ? 'creationRefs'
      : entityType === MediaEntityType.COLLECTION
        ? 'collectionRefs'
        : 'atelierRefs';

  await prisma.media.create({
    data: {
      bucket: upload.bucket,
      objectKey: upload.objectKey,
      url: upload.url,
      altText,
      mimeType: 'image/jpeg',
      sizeBytes: upload.sizeBytes,
      entityType,
      entityId,
      sortOrder,
      [relationField]: { connect: { id: entityId } },
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
