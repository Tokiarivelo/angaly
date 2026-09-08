import { createStorageClientFromEnv, type StorageClient, type StorageBucketName } from '@angaly/storage';
import * as bcrypt from 'bcrypt';

import { CategoryKind, CreationAvailability, MediaEntityType, PrismaClient, Role } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ANGALY database (foundation)...');

  const adminPasswordHash = await bcrypt.hash('Admin@Angaly2026!', 12);
  const adminUser = await prisma.user.upsert({
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
    { slug: 'mariage-a-madagascar', name: 'Mariage', kind: CategoryKind.BLOG },
    { slug: 'conseils-costume', name: 'Conseils Costume', kind: CategoryKind.BLOG },
    { slug: 'tendances', name: 'Tendances', kind: CategoryKind.BLOG },
    { slug: 'coulisses-atelier', name: 'Coulisses', kind: CategoryKind.BLOG },
    { slug: 'entretien-vetements', name: 'Entretien', kind: CategoryKind.BLOG },
    { slug: 'haute-couture', name: 'Haute Couture', kind: CategoryKind.BLOG },
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

  // journal-liste (docs/pages/journal-liste.md) needs real content to render against —
  // authorId is a required FK to User, seeded directly per docs/features/blog.md.
  const hauteCouture = categoryBySlug.get('haute-couture')!;
  const mariageMadagascar = categoryBySlug.get('mariage-a-madagascar')!;
  const coulissesAtelier = categoryBySlug.get('coulisses-atelier')!;
  const conseilsMode = categoryBySlug.get('conseils-mode')!;
  const conseilsCostume = categoryBySlug.get('conseils-costume')!;

  const blogPosts = [
    {
      slug: 'eternite-nouvelle-collection',
      title: "L'Éternité : Au cœur de notre nouvelle collection",
      categoryId: hauteCouture.id,
      excerpt:
        "Découvrez l'inspiration et le savoir-faire méticuleux qui ont donné vie à notre dernière collection de robes de mariée. Un voyage à travers des centaines d'heures de broderie à la main et de drapés soyeux.",
      content:
        "Chaque saison, la Collection Éternelle naît d'un dialogue silencieux entre nos artisans et la matière. Cette année, ce dialogue a pris la forme d'une broderie baroque, fil de soie après fil de soie, posée à la main sur un satin duchesse d'une blancheur presque irréelle.\n\nDes centaines d'heures ont été nécessaires pour donner vie à chaque robe : le drapé étudié pièce par pièce, les cristaux sertis un à un, la coupe ajustée au corps de chaque femme qui la portera. C'est cette patience, plus que toute autre chose, qui définit la haute couture selon ANGALY.",
      publishedAt: new Date('2026-03-01T00:00:00.000Z'),
      photo: '1682226335318-f1911fdef7c1',
      photoAlt: 'Détail brodé de la Robe Éternelle',
    },
    {
      slug: 'porter-bleu-nuit-elegance',
      title: 'Comment porter le bleu nuit avec élégance',
      categoryId: conseilsMode.id,
      excerpt:
        "Couleur signature de la Maison Angaly, le bleu nuit est une alternative sophistiquée au noir. Découvrez nos conseils pour l'adopter au quotidien comme pour les grandes occasions.",
      content:
        "Le bleu nuit n'est pas simplement une couleur pour ANGALY : c'est une signature. Plus profond que le noir, plus habité, il absorbe la lumière sans jamais l'éteindre complètement.\n\nPorté en total look pour une soirée, ou glissé en un seul accessoire dans une tenue de jour, le bleu nuit s'accorde naturellement à l'ivoire, au champagne et aux dorés discrets — la palette même de la Maison.",
      publishedAt: new Date('2026-02-20T00:00:00.000Z'),
      photo: '1762605135318-f34a993cbcf0',
      photoAlt: 'Ensemble bleu nuit, styling éditorial minimaliste',
    },
    {
      slug: 'secret-atelier-travail-soie',
      title: "Dans le secret de l'atelier : Le travail de la soie",
      categoryId: coulissesAtelier.id,
      excerpt:
        "Plongez dans l'intimité de nos artisans et découvrez les techniques traditionnelles malgaches appliquées à la soie sauvage.",
      content:
        "La soie sauvage malgache exige une patience que peu de matières demandent. Avant même la première coupe, chaque pièce est étudiée à la lumière naturelle de l'atelier pour en comprendre le grain, le tombé, les irrégularités qui font justement sa noblesse.\n\nNos artisans perpétuent des gestes transmis de génération en génération : le fil est guidé à la main, jamais forcé, pour que la soie garde toute sa vie propre une fois portée.",
      publishedAt: new Date('2026-02-10T00:00:00.000Z'),
      photo: '1457972657980-4c9fddebec8d',
      photoAlt: "Mains d'une couturière travaillant la soie",
    },
    {
      slug: 'se-marier-antananarivo-guide-lieux',
      title: "Se marier à Antananarivo : Guide des lieux d'exception",
      categoryId: mariageMadagascar.id,
      excerpt:
        'Notre sélection exclusive des domaines et salles de réception les plus prestigieux de la capitale pour un mariage inoubliable.',
      content:
        "Antananarivo regorge de lieux capables d'accueillir un mariage à la hauteur d'une robe ANGALY : demeures coloniales, jardins suspendus, salles baignées de lumière naturelle.\n\nAu-delà du décor, c'est l'attention portée aux détails qui transforme un lieu en souvenir : la table dressée, la lumière du soir, le silence juste avant l'entrée de la mariée. Notre équipe accompagne volontiers nos clientes dans ce choix, en lien avec nos partenaires de confiance.",
      publishedAt: new Date('2026-01-25T00:00:00.000Z'),
      photo: '1723832348140-a2d9eb1753b1',
      photoAlt: 'Table de réception de mariage élégante',
    },
    {
      slug: 'art-costume-sur-mesure-marie',
      title: "L'art du costume sur-mesure pour le marié",
      categoryId: conseilsCostume.id,
      excerpt:
        "Un costume qui incarne l'élégance intemporelle de l'homme moderne, cousu pour le jour le plus important de sa vie.",
      content:
        "Le costume du marié mérite la même attention que la robe qu'il accompagnera. Une coupe ajustée à l'épaule, un tombé de tissu qui ne cède jamais, une doublure choisie avec autant de soin que l'étoffe visible.\n\nNos maîtres tailleurs travaillent chaque costume sur plusieurs essayages, ajustant patiemment jusqu'à ce que la silhouette soit exactement celle voulue — ni plus, ni moins.",
      publishedAt: new Date('2026-01-10T00:00:00.000Z'),
      photo: '1507679799987-c73779587ccf',
      photoAlt: 'Détail de couture sur costume sur-mesure',
    },
  ];

  const createdBlogPosts = new Map<string, { id: string }>();
  for (const { photo: _photo, photoAlt: _photoAlt, ...postData } of blogPosts) {
    const post = await prisma.blogPost.upsert({
      where: { slug: postData.slug },
      update: postData,
      create: { ...postData, authorId: adminUser.id },
    });
    createdBlogPosts.set(post.slug, post);
  }
  console.log(`✅ ${blogPosts.length} articles de journal créés`);

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
      // atelier-detail's "L'atelier en images" gallery needs more than one photo to avoid
      // cycling the same cover shot across every tile — see docs/pages/atelier-detail.md.
      await attachPhoto(
        storage,
        'ateliers',
        '1588618777461-81fe15d547be',
        "Bobines de fil — l'atelier Antananarivo Centre",
        MediaEntityType.ATELIER,
        atelier.id,
        1,
      );
      await attachPhoto(
        storage,
        'ateliers',
        '1739127871640-044ef7c5f131',
        "Détail de broderie — l'atelier Antananarivo Centre",
        MediaEntityType.ATELIER,
        atelier.id,
        2,
      );
      await attachPhoto(
        storage,
        'ateliers',
        '1457972657980-4c9fddebec8d',
        "Mains d'une couturière au travail — l'atelier Antananarivo Centre",
        MediaEntityType.ATELIER,
        atelier.id,
        3,
      );
      console.log("✅ Photos de l'atelier téléchargées et hébergées sur MinIO");

      for (const { slug, photo, photoAlt } of blogPosts) {
        const post = createdBlogPosts.get(slug);
        if (!post) continue;
        await attachPhoto(storage, 'blog', photo, photoAlt, MediaEntityType.BLOG_POST, post.id);
      }
      console.log('✅ Photos des articles de journal téléchargées et hébergées sur MinIO');
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
        : entityType === MediaEntityType.BLOG_POST
          ? 'blogPostRefs'
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
