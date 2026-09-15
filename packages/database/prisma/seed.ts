import { createStorageClientFromEnv, type StorageClient, type StorageBucketName } from '@angaly/storage';
import * as bcrypt from 'bcrypt';

import {
  CategoryKind,
  ContentStatus,
  CreationAvailability,
  Locale,
  MediaEntityType,
  PrismaClient,
  ProductAvailability,
  Role,
} from '../generated/client';

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
  await prisma.customer.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      firstName: 'Admin',
      lastName: 'ANGALY',
      phone: '+261 20 22 245 10',
    },
  });
  console.log('✅ Admin user ready (admin@angaly.mg)');

  const weekdayStandardHours = { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] };
  const weekdayIvandryHours = { isOpen: true, slots: [{ open: '10:00', close: '19:00' }] };
  const weekdayAntsirabeHours = { isOpen: true, slots: [{ open: '08:30', close: '17:30' }] };
  const closedDay = { isOpen: false, slots: [] };

  // Shape validated by apps/api/src/ateliers/domain/value-objects/opening-hours.vo.ts
  // (mirrors AtelierOpeningHours in @angaly/types — keep both in sync).
  const ateliersData = [
    {
      slug: 'antananarivo-centre',
      name: 'Maison Mère & Atelier Haute Couture',
      address: "12 Rue de l'Artisanat, Ankorondrano",
      city: 'Antananarivo',
      phone: '+261 20 22 245 10',
      latitude: -18.8827,
      longitude: 47.5177,
      openingHoursJson: {
        monday: weekdayStandardHours,
        tuesday: weekdayStandardHours,
        wednesday: weekdayStandardHours,
        thursday: weekdayStandardHours,
        friday: weekdayStandardHours,
        saturday: { isOpen: true, slots: [{ open: '09:00', close: '13:00' }] },
        sunday: closedDay,
      },
      servicesJson: ['Essayage Privé', 'Haute Couture', 'Sur Mesure', 'Retouche d’Art'],
      photos: [
        { photo: '1641293498376-139cfe50ff67', alt: "L'atelier Antananarivo Centre" },
        { photo: '1588618777461-81fe15d547be', alt: "Bobines de fil — l'atelier Antananarivo Centre" },
        { photo: '1739127871640-044ef7c5f131', alt: "Détail de broderie — l'atelier Antananarivo Centre" },
        { photo: '1457972657980-4c9fddebec8d', alt: "Mains d'une couturière au travail — l'atelier Antananarivo Centre" },
      ],
    },
    {
      slug: 'antananarivo-ivandry',
      name: 'Salon Privé & Atelier Sur Mesure Ivandry',
      address: 'Villa Colbert, Lot II M 85 Ter, Ivandry',
      city: 'Antananarivo',
      phone: '+261 20 22 412 80',
      latitude: -18.8682,
      longitude: 47.5305,
      openingHoursJson: {
        monday: weekdayIvandryHours,
        tuesday: weekdayIvandryHours,
        wednesday: weekdayIvandryHours,
        thursday: weekdayIvandryHours,
        friday: weekdayIvandryHours,
        saturday: { isOpen: true, slots: [{ open: '10:00', close: '16:00' }] },
        sunday: closedDay,
      },
      servicesJson: ['Sur Mesure Homme', 'Costumes de Gala', 'Salon VIP', 'Conseil Stylisme'],
      photos: [
        { photo: '1593030761757-71fae45fa0e7', alt: "Salon Privé Ivandry — Espace d'essayage sur mesure" },
        { photo: '1507679799987-c73779587ccf', alt: 'Atelier de coupe tailleur et salon VIP — Ivandry' },
      ],
    },
    {
      slug: 'antsirabe-soie',
      name: "Atelier Broderie d'Art & Soie Sauvage",
      address: 'Avenue Jean Ralaimongo, Quartier des Thermes',
      city: 'Antsirabe',
      phone: '+261 20 44 489 30',
      latitude: -19.8659,
      longitude: 47.0333,
      openingHoursJson: {
        monday: closedDay,
        tuesday: weekdayAntsirabeHours,
        wednesday: weekdayAntsirabeHours,
        thursday: weekdayAntsirabeHours,
        friday: weekdayAntsirabeHours,
        saturday: weekdayAntsirabeHours,
        sunday: closedDay,
      },
      servicesJson: ['Filature de Soie Sauvage', 'Broderie de Lunéville', 'Confection Artisanale'],
      photos: [
        { photo: '1528459801416-a9e53bbf4e17', alt: 'Atelier de soierie et métiers à tisser — Antsirabe' },
        { photo: '1516762689617-e1cffcef479d', alt: 'Détail de soierie sauvage malgache — Antsirabe' },
      ],
    },
    {
      slug: 'toamasina-croisiere',
      name: 'Comptoir Côtier & Confection Maritime',
      address: 'Boulevard de la Libération, Front de Mer',
      city: 'Toamasina',
      phone: '+261 20 53 355 20',
      latitude: -18.1499,
      longitude: 49.4023,
      openingHoursJson: {
        monday: weekdayStandardHours,
        tuesday: weekdayStandardHours,
        wednesday: weekdayStandardHours,
        thursday: weekdayStandardHours,
        friday: weekdayStandardHours,
        saturday: { isOpen: true, slots: [{ open: '09:00', close: '14:00' }] },
        sunday: closedDay,
      },
      servicesJson: ['Collection Croisière', 'Linge Noble & Soie', 'Ajustement Express'],
      photos: [
        { photo: '1441986300917-64674bd600d8', alt: 'Comptoir Côtier Toamasina' },
        { photo: '1469334031218-e382a71b716b', alt: "Salon d'essayage vue océan — Toamasina" },
      ],
    },
  ];

  const createdAteliers = new Map<string, { id: string }>();
  for (const { photos: _photos, ...data } of ateliersData) {
    const atelier = await prisma.atelier.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });
    createdAteliers.set(atelier.slug, atelier);
  }
  console.log(`✅ ${ateliersData.length} ateliers créés ou mis à jour`);

  const categories = [
    { slug: 'robes-de-mariee', name: 'Robes de mariée', kind: CategoryKind.CREATION },
    { slug: 'costumes-homme', name: 'Costumes homme', kind: CategoryKind.CREATION },
    { slug: 'robes-de-soiree', name: 'Robes de soirée', kind: CategoryKind.CREATION },
    { slug: 'sur-mesure', name: 'Sur Mesure', kind: CategoryKind.CREATION },
    { slug: 'coulisses', name: 'Coulisses', kind: CategoryKind.CREATION },
    { slug: 'creation-du-mois', name: 'Création du mois', kind: CategoryKind.CREATION },
    { slug: 'pret-a-porter', name: 'Prêt-à-porter', kind: CategoryKind.PRODUCT },
    { slug: 'conseils-mode', name: 'Conseils mode', kind: CategoryKind.BLOG },
    { slug: 'mariage-a-madagascar', name: 'Mariage à Madagascar', kind: CategoryKind.BLOG },
    { slug: 'conseils-costume', name: 'Conseils costume', kind: CategoryKind.BLOG },
    { slug: 'tendances', name: 'Tendances', kind: CategoryKind.BLOG },
    { slug: 'coulisses-atelier', name: "Coulisses de l'atelier", kind: CategoryKind.BLOG },
    { slug: 'entretien-vetements', name: 'Entretien des vêtements', kind: CategoryKind.BLOG },
    { slug: 'haute-couture', name: 'Haute Couture', kind: CategoryKind.BLOG },
  ];
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, kind: category.kind },
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
  const surMesureCategory = categoryBySlug.get('sur-mesure')!;
  const coulissesCategory = categoryBySlug.get('coulisses')!;
  const creationDuMoisCategory = categoryBySlug.get('creation-du-mois')!;

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
    // --- Robes de mariée ---
    {
      slug: 'robe-eternelle',
      name: 'Robe Éternelle',
      categoryId: mariage.id,
      collectionId: collectionEternelle.id,
      description:
        "L'incarnation du raffinement intemporel. La Robe Éternelle marie la structure architecturale d'un bustier corseté à la légèreté d'une jupe en cascade. Chaque détail est pensé pour sublimer la silhouette avec une élégance souveraine, digne des plus grands ateliers de couture.",
      genre: 'Femme',
      type: 'Mariage',
      color: 'Ivoire',
      style: 'Classique',
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
      genre: 'Femme',
      type: 'Mariage',
      color: 'Blanc',
      style: 'Traditionnel',
      materials: 'Tulle et broderies fines',
      techniques: null,
      availability: CreationAvailability.PIECE_UNIQUE,
      reproducible: false,
      isFeatured: true,
      featuredFrom: new Date('2026-02-05T00:00:00.000Z'),
      photo: '1583939003579-730e3918a45a',
      photoAlt: 'Romance Royale — robe de mariée',
    },
    {
      slug: 'princesse-tsingy',
      name: 'Princesse des Tsingy',
      categoryId: mariage.id,
      collectionId: null,
      description:
        'Une création féerique en organza de soie rebrodé, inspirée par les reliefs majestueux des Tsingy de Madagascar.',
      genre: 'Femme',
      type: 'Mariage',
      color: 'Blanc',
      style: 'Glamour',
      materials: 'Organza de soie, cristaux de roche',
      techniques: 'Plissé soleil, incrustations artisanales',
      availability: CreationAvailability.PIECE_UNIQUE,
      reproducible: false,
      isFeatured: true,
      featuredFrom: new Date('2026-02-01T00:00:00.000Z'),
      photo: '1546804784-896d0dca3805',
      photoAlt: 'Princesse des Tsingy — robe de mariée couture',
    },
    {
      slug: 'aurore-boheme',
      name: 'Aurore Bohème',
      categoryId: mariage.id,
      collectionId: null,
      description:
        'Robe de mariée fluide au dos nu vertigineux, rehaussée de motifs floraux en dentelle de Chantilly.',
      genre: 'Femme',
      type: 'Mariage',
      color: 'Ivoire',
      style: 'Moderne',
      materials: 'Crêpe georgette de soie, dentelle de Chantilly',
      techniques: 'Finitions roulottées à la main',
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: false,
      featuredFrom: new Date('2026-01-28T00:00:00.000Z'),
      photo: '1595777457583-95e059d581b8',
      photoAlt: 'Aurore Bohème — robe de mariée fluide',
    },

    // --- Costumes homme ---
    {
      slug: 'costume-trois-pieces-nuit',
      name: 'Costume Trois-Pièces Nuit',
      categoryId: costumes.id,
      collectionId: null,
      description:
        'Costume trois-pièces d’exception taillé dans une laine Super 150’s bleu nuit, avec gilet ajusté et doublure en soie.',
      genre: 'Homme',
      type: 'Costume',
      color: 'Bleu Nuit',
      style: 'Classique',
      materials: 'Laine Super 150’s, doublure en satin de soie',
      techniques: 'Montage semi-traditionnel, surpiqûres AMF faites main',
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: true,
      featuredFrom: new Date('2026-01-22T00:00:00.000Z'),
      photo: '1617127365659-c47fa864d8bc',
      photoAlt: 'Costume Trois-Pièces Nuit — coupe tailleur masculin',
    },
    {
      slug: 'costume-prince-de-galles',
      name: 'Costume Prince de Galles',
      categoryId: costumes.id,
      collectionId: null,
      description:
        'Veste croisée et pantalon à pinces dans un tissu Prince de Galles subtilement rehaussé de fils marine et bordeaux.',
      genre: 'Homme',
      type: 'Costume',
      color: 'Gris',
      style: 'Moderne',
      materials: 'Laine peignée d’Angleterre, boutons en corne naturelle',
      techniques: 'Piquage du revers à la main, plastron flottant',
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: true,
      featuredFrom: new Date('2026-01-18T00:00:00.000Z'),
      photo: '1617137984095-74e4e5e3613f',
      photoAlt: 'Costume Prince de Galles — tailleur croisé',
    },
    {
      slug: 'smoking-grand-bal',
      name: 'Smoking Grand Bal',
      categoryId: costumes.id,
      collectionId: null,
      description:
        'Smoking de cérémonie noir profond avec revers châle en satin de soie et galon tressé le long de la jambe.',
      genre: 'Homme',
      type: 'Costume',
      color: 'Noir',
      style: 'Classique',
      materials: 'Laine mérinos extra-fine et satin de soie noir',
      techniques: 'Entoilage complet traditionnel, boutonnière milanaise',
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: false,
      featuredFrom: new Date('2026-01-10T00:00:00.000Z'),
      photo: '1507679799987-c73779587ccf',
      photoAlt: 'Smoking Grand Bal — tenue de soirée masculine',
    },

    // --- Robes de soirée ---
    {
      slug: 'nuit-opera',
      name: "Nuit d'Opéra",
      categoryId: soiree.id,
      collectionId: collectionEternelle.id,
      description: 'Soie fluide et accents champagne pour une soirée mémorable.',
      genre: 'Femme',
      type: 'Soirée',
      color: 'Champagne',
      style: 'Glamour',
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
      genre: 'Femme',
      type: 'Soirée',
      color: 'Or',
      style: 'Glamour',
      materials: null,
      techniques: null,
      availability: CreationAvailability.PIECE_UNIQUE,
      reproducible: false,
      isFeatured: true,
      featuredFrom: new Date('2026-02-12T00:00:00.000Z'),
      photo: '1571908599407-cdb918ed83bf',
      photoAlt: 'Robe Majesté — robe de soirée ornée',
    },
    {
      slug: 'diademe-imperial',
      name: 'Diadème Impérial',
      categoryId: soiree.id,
      collectionId: collectionEternelle.id,
      description:
        'Une robe de bal majestueuse issue de la Collection Éternelle, rehaussée de cristaux et drapé sculptural.',
      genre: 'Femme',
      type: 'Soirée',
      color: 'Bleu Nuit',
      style: 'Classique',
      materials: 'Taffetas de soie, perles de cristal',
      techniques: 'Drapé haute couture, corset baleiné main',
      availability: CreationAvailability.PIECE_UNIQUE,
      reproducible: false,
      isFeatured: true,
      featuredFrom: new Date('2026-02-14T00:00:00.000Z'),
      photo: '1515886657613-9f3515b0c78f',
      photoAlt: 'Diadème Impérial — Collection Éternelle',
    },
    {
      slug: 'crepuscule-dore',
      name: 'Crépuscule Doré',
      categoryId: soiree.id,
      collectionId: null,
      description:
        'Robe fourreau en velours de soie noir avec découpes géométriques dorées et fente latérale haute.',
      genre: 'Femme',
      type: 'Soirée',
      color: 'Noir',
      style: 'Moderne',
      materials: 'Velours de soie, lamé d’or',
      techniques: 'Broderie au fil métallique, corset intégré',
      availability: CreationAvailability.PIECE_UNIQUE,
      reproducible: false,
      isFeatured: false,
      featuredFrom: new Date('2026-01-30T00:00:00.000Z'),
      photo: '1520975916090-3105956dac38',
      photoAlt: 'Crépuscule Doré — robe de cocktail haute couture',
    },

    // --- Sur Mesure ---
    {
      slug: 'signature-artisan',
      name: 'Signature Artisan',
      categoryId: surMesureCategory.id,
      collectionId: null,
      description:
        'Le raffinement du costume masculin sur mesure, cousu main dans nos ateliers pour une coupe irréprochable.',
      genre: 'Homme',
      type: 'Sur mesure',
      color: 'Noir',
      style: 'Traditionnel',
      materials: 'Détails à la main, laine d’exception',
      techniques: 'Entoilage complet, boutonnières main',
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
      categoryId: surMesureCategory.id,
      collectionId: null,
      description: 'Un costume trois-pièces à carreaux sur mesure, taillé dans une laine froide d’exception.',
      genre: 'Homme',
      type: 'Sur mesure',
      color: 'Bleu Nuit',
      style: 'Moderne',
      materials: 'Laine froide sur mesure',
      techniques: 'Gilet croisé, coutures ouvertes repassées au fer lourd',
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: true,
      featuredFrom: new Date('2026-01-15T00:00:00.000Z'),
      photo: '1594938298603-c8148c4dae35',
      photoAlt: 'Le Dandy — costume trois-pièces sur mesure',
    },
    {
      slug: 'tailleur-sur-mesure',
      name: 'Tailleur Sur Mesure',
      categoryId: surMesureCategory.id,
      collectionId: null,
      description:
        "L'art du costume tailleur confectionné sur mesure pour sublimer chaque morphologie avec une précision millimétrée.",
      genre: 'Femme',
      type: 'Sur mesure',
      color: 'Noir',
      style: 'Minimaliste',
      materials: 'Laine extra-fine et doublure soie',
      techniques: 'Coupe au millimètre, finitions tailleur main',
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: true,
      featuredFrom: new Date('2026-01-25T00:00:00.000Z'),
      photo: '1769868800959-533a3f907d60',
      photoAlt: 'Tailleur Sur Mesure — détail de coupe',
    },
    {
      slug: 'smoking-grand-soir-sur-mesure',
      name: 'Smoking Grand Soir Sur Mesure',
      categoryId: surMesureCategory.id,
      collectionId: null,
      description:
        'Smoking deux-pièces sur mesure en laine extra-fine et revers châle en faille de soie, taillé pour les soirées de gala.',
      genre: 'Homme',
      type: 'Sur mesure',
      color: 'Noir',
      style: 'Classique',
      materials: "Laine Super 150's, faille de soie",
      techniques: 'Montage traditionnel entoilé, boutonnières milanaises cousues main',
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: true,
      featuredFrom: new Date('2026-02-22T00:00:00.000Z'),
      photo: '1593030761757-71fae45fa0e7',
      photoAlt: 'Smoking Grand Soir — Confection sur mesure',
    },

    // --- Coulisses ---
    {
      slug: 'coulisses-art-du-perlage',
      name: "L'Art du Perlage à la Main",
      categoryId: coulissesCategory.id,
      collectionId: null,
      description:
        'Dans le secret de nos ateliers : plus de 120 heures de broderie et de perlage minutieux sur dentelle de Calais.',
      genre: 'Femme',
      type: 'Coulisses',
      color: 'Blanc',
      style: 'Traditionnel',
      materials: "Dentelle de Calais, perles de verre de Bohême, fil d'argent",
      techniques: 'Point de Lunéville, perlage guidé à la loupe',
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: true,
      featuredFrom: new Date('2026-02-18T00:00:00.000Z'),
      photo: '1457972657980-4c9fddebec8d',
      photoAlt: 'Coulisses : mains de nos brodeuses au travail',
    },
    {
      slug: 'coulisses-entoilage-traditionnel',
      name: "L'Entoilage Traditionnel",
      categoryId: coulissesCategory.id,
      collectionId: null,
      description:
        'Découvrez les étapes de confection artisanale de nos vestes à plastron flottant en crin de cheval naturel.',
      genre: 'Homme',
      type: 'Coulisses',
      color: 'Ivoire',
      style: 'Traditionnel',
      materials: "Toile de lin d'Irlande, crin de cheval naturel, laine d'agneau",
      techniques: 'Piquage du col à la main, montage traditionnel flottant',
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: true,
      featuredFrom: new Date('2026-02-08T00:00:00.000Z'),
      photo: '1588618777461-81fe15d547be',
      photoAlt: 'Coulisses : entoilage traditionnel d’une veste tailleur',
    },
    {
      slug: 'coulisses-plisse-soleil',
      name: "Le Plissé Soleil : Géométrie et Poésie",
      categoryId: coulissesCategory.id,
      collectionId: null,
      description:
        'Mise en forme des cartons de plissage au métier traditionnel pour un mouvement aérien incomparable.',
      genre: 'Femme',
      type: 'Coulisses',
      color: 'Doré',
      style: 'Artisanal',
      materials: 'Cartons de métier à plisser, mousseline de soie',
      techniques: 'Plissage vapeur traditionnel au four à bois',
      availability: CreationAvailability.SUR_DEMANDE,
      reproducible: true,
      isFeatured: false,
      featuredFrom: new Date('2026-01-12T00:00:00.000Z'),
      photo: '1739127871640-044ef7c5f131',
      photoAlt: 'Coulisses : cartons de plissage soleil',
    },

    // --- Création du mois ---
    {
      slug: 'creation-du-mois-symphonie',
      name: 'Symphonie Champagne',
      categoryId: creationDuMoisCategory.id,
      collectionId: null,
      description:
        "Notre création vedette du mois : une silhouette sirène sculptée en satin de soie champagne, ornée d'incrustations de cristaux et perles baroques.",
      genre: 'Femme',
      type: 'Soirée',
      color: 'Champagne',
      style: 'Glamour',
      materials: 'Satin de soie champagne, cristaux Swarovski',
      techniques: 'Broderie florale en relief, incrustation de perles',
      availability: CreationAvailability.PIECE_UNIQUE,
      reproducible: false,
      isFeatured: true,
      featuredFrom: new Date('2026-03-01T00:00:00.000Z'),
      photo: '1566174053879-31528523f8ae',
      photoAlt: 'Symphonie Champagne — Création du mois',
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

  // --- Produits Prêt-à-porter (docs/pages/pret-a-porter-catalogue.md, docs/pages/fiche-produit.md) ---
  // Distinct des créations pièce-unique ci-dessus : vêtements disponibles immédiatement,
  // avec variantes taille (CATALOGUE_SIZES — tailles FR 34-44) et couleur (palette du filtre
  // CATALOGUE_COLOR_FILTERS : Navy/White/Champagne/Black/Grey) pour que les filtres du
  // catalogue et le sélecteur de couleur de la fiche produit aient de vraies données à filtrer.
  const pretAPorterCategory = categoryBySlug.get('pret-a-porter')!;
  const atelierAntananarivo = createdAteliers.get('antananarivo-centre');

  const products = [
    {
      sku: 'ANG-PAP-001',
      slug: 'chemise-lin-antsirabe',
      name: 'Chemise Lin Antsirabe',
      categoryId: pretAPorterCategory.id,
      atelierId: atelierAntananarivo?.id ?? null,
      description:
        'Chemise fluide en lin naturel tissé à Madagascar, coupe droite et col mao discret — un essentiel intemporel pour toutes les saisons.',
      price: 138000,
      status: ProductAvailability.AVAILABLE,
      material: 'Lin',
      sizes: ['36', '38', '40', '42'],
      // Each color has its own photo — picking a swatch on the product page
      // swaps the gallery to that colorway's pictures (see ColorSelector.tsx).
      colorPhotos: [
        { color: 'White', photo: '1496747611176-843222e1e57c', photoAlt: 'Chemise Lin Antsirabe — White' },
        { color: 'Champagne', photo: '1503342217505-b0a15ec3261c', photoAlt: 'Chemise Lin Antsirabe — Champagne' },
      ],
      photo: '1509631179647-0177331693ae',
      photoAlt: 'Chemise Lin Antsirabe',
    },
    {
      sku: 'ANG-PAP-002',
      slug: 'robe-portefeuille-soiree',
      name: 'Robe Portefeuille Soirée',
      categoryId: pretAPorterCategory.id,
      atelierId: atelierAntananarivo?.id ?? null,
      description:
        'Robe portefeuille en crêpe fluide, silhouette cintrée à la taille et jupe évasée pour une allure élégante en toute occasion.',
      price: 245000,
      status: ProductAvailability.LAST_PIECE,
      material: 'Crêpe',
      sizes: ['34', '36', '38'],
      colorPhotos: [
        { color: 'Black', photo: '1507003211169-0a1dd7228f2d', photoAlt: 'Robe Portefeuille Soirée — Black' },
        { color: 'Champagne', photo: '1507679799987-c73779587ccf', photoAlt: 'Robe Portefeuille Soirée — Champagne' },
      ],
      photo: '1512436991641-6745cdb1723f',
      photoAlt: 'Robe Portefeuille Soirée',
    },
    {
      sku: 'ANG-PAP-003',
      slug: 'blazer-structure-marine',
      name: 'Blazer Structuré Marine',
      categoryId: pretAPorterCategory.id,
      atelierId: atelierAntananarivo?.id ?? null,
      description:
        "Blazer cintré à l'épaule structurée et doublure satinée — la pièce signature d'un vestiaire de bureau sophistiqué.",
      price: 312000,
      status: ProductAvailability.AVAILABLE,
      material: 'Laine mélangée',
      sizes: ['36', '38', '40', '42'],
      colorPhotos: [
        { color: 'Navy', photo: '1515886657613-9f3515b0c78f', photoAlt: 'Blazer Structuré Marine — Navy' },
        { color: 'Black', photo: '1517841905240-472988babdf9', photoAlt: 'Blazer Structuré Marine — Black' },
      ],
      photo: '1534528741775-53994a69daeb',
      photoAlt: 'Blazer Structuré Marine',
    },
    {
      sku: 'ANG-PAP-004',
      slug: 'pantalon-tailleur-ivoire',
      name: 'Pantalon Tailleur Ivoire',
      categoryId: pretAPorterCategory.id,
      atelierId: atelierAntananarivo?.id ?? null,
      description:
        'Pantalon fluide à pinces, taille haute et coupe droite — le compagnon parfait du blazer structuré.',
      price: 168000,
      status: ProductAvailability.ON_ORDER,
      material: 'Viscose',
      sizes: ['34', '36', '38', '40'],
      colorPhotos: [
        { color: 'White', photo: '1519741497674-611481863552', photoAlt: 'Pantalon Tailleur Ivoire — White' },
        { color: 'Black', photo: '1520006403909-838d6b92c22e', photoAlt: 'Pantalon Tailleur Ivoire — Black' },
      ],
      photo: '1544078751-58fee2d8a03b',
      photoAlt: 'Pantalon Tailleur Ivoire',
    },
    {
      sku: 'ANG-PAP-005',
      slug: 'chemisier-soie-champagne',
      name: 'Chemisier Soie Champagne',
      categoryId: pretAPorterCategory.id,
      atelierId: atelierAntananarivo?.id ?? null,
      description:
        'Chemisier en soie naturelle au tombé délicat et col lavallière discret — la touche précieuse du vestiaire quotidien.',
      price: 198000,
      status: ProductAvailability.RESERVED,
      material: 'Soie',
      sizes: ['34', '36', '38'],
      colorPhotos: [
        { color: 'Champagne', photo: '1520975916090-3105956dac38', photoAlt: 'Chemisier Soie Champagne — Champagne' },
        { color: 'White', photo: '1528459801416-a9e53bbf4e17', photoAlt: 'Chemisier Soie Champagne — White' },
      ],
      photo: '1571908599407-cdb918ed83bf',
      photoAlt: 'Chemisier Soie Champagne',
    },
    {
      sku: 'ANG-PAP-006',
      slug: 'jupe-plissee-grise',
      name: 'Jupe Plissée Grise',
      categoryId: pretAPorterCategory.id,
      atelierId: atelierAntananarivo?.id ?? null,
      description:
        'Jupe plissée mi-longue en satin, mouvement fluide à chaque pas — pour une silhouette élégante du bureau au dîner.',
      price: 132000,
      status: ProductAvailability.OUT_OF_STOCK,
      material: 'Satin',
      sizes: ['36', '38', '40', '42'],
      colorPhotos: [
        { color: 'Grey', photo: '1539109136881-3be0616acf4b', photoAlt: 'Jupe Plissée Grise — Grey' },
        { color: 'Black', photo: '1546804784-896d0dca3805', photoAlt: 'Jupe Plissée Grise — Black' },
      ],
      photo: '1593032465175-481ac7f401a0',
      photoAlt: 'Jupe Plissée Grise',
    },
  ];

  const createdProducts = new Map<string, { id: string }>();
  // Variant ids sharing the same (productSlug, color) — every size of a color
  // points at the same colorway photo below, keyed as "<slug>::<color>".
  const variantIdsByProductColor = new Map<string, string[]>();

  for (const { sizes, colorPhotos, material, photo: _photo, photoAlt: _photoAlt, ...productData } of products) {
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: productData,
      create: productData,
    });
    createdProducts.set(product.slug, product);

    const quantityAvailable =
      productData.status === ProductAvailability.OUT_OF_STOCK
        ? 0
        : productData.status === ProductAvailability.LAST_PIECE
          ? 1
          : 6;
    const quantityReserved = productData.status === ProductAvailability.RESERVED ? 1 : 0;

    for (const size of sizes) {
      for (const { color } of colorPhotos) {
        const colorCode = color.slice(0, 3).toUpperCase();
        const variantSku = `${productData.sku}-${size}-${colorCode}`;
        const variant = await prisma.productVariant.upsert({
          where: { sku: variantSku },
          update: { productId: product.id, size, color, material },
          create: { productId: product.id, sku: variantSku, size, color, material },
        });
        await prisma.inventory.upsert({
          where: { variantId: variant.id },
          update: {},
          create: { variantId: variant.id, quantityAvailable, quantityReserved },
        });

        const key = `${product.slug}::${color}`;
        variantIdsByProductColor.set(key, [...(variantIdsByProductColor.get(key) ?? []), variant.id]);
      }
    }
  }
  console.log(`✅ ${products.length} produits prêt-à-porter créés (avec variantes et stock)`);

  // journal-liste (docs/pages/journal-liste.md) needs real content to render against —
  // authorId is a required FK to User, seeded directly per docs/features/blog.md.
  const hauteCouture = categoryBySlug.get('haute-couture')!;
  const mariageMadagascar = categoryBySlug.get('mariage-a-madagascar')!;
  const coulissesAtelier = categoryBySlug.get('coulisses-atelier')!;
  const conseilsMode = categoryBySlug.get('conseils-mode')!;
  const conseilsCostume = categoryBySlug.get('conseils-costume')!;
  const tendances = categoryBySlug.get('tendances')!;
  const entretienVetements = categoryBySlug.get('entretien-vetements')!;

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
      slug: 'tendances-couture-2026-minimalisme-et-reliefs',
      title: 'Tendances Couture 2026 : Entre pureté architecturale et reliefs organiques',
      categoryId: tendances.id,
      excerpt:
        "Découvrez les mouvements esthétiques qui redéfinissent la haute couture cette saison : plissés sculpturaux, tons minéraux et fluidité aérienne.",
      content:
        "L'année 2026 marque un retour affirmé à l'essentiel : les coupes se font plus architecturales, les lignes plus franches, mais la matière conserve une sensualité tactile incomparable.\n\nDans les ateliers ANGALY, cette tendance prend corps à travers l'alternance de volumes audacieux et de tombés verticaux presque liquides. Les teintes minérales — argile douce, basalte feutré, sable chaud — rencontrent nos bleus signature pour esquisser une féminité à la fois protectrice et affirmée.",
      publishedAt: new Date('2026-03-04T00:00:00.000Z'),
      photo: '1490481651871-ab68de25d43d',
      photoAlt: 'Silhouette haute couture contemporaine, tons neutres et coupe fluide',
    },
    {
      slug: 'guide-entretien-soie-lin-pieces-exception',
      title: "Prendre soin de ses étoffes : Le guide d'entretien des soies et lins d'art",
      categoryId: entretienVetements.id,
      excerpt:
        "Soie sauvage malgache, lin texturé, broderies fines : les gestes et rituels indispensables pour que vos créations traversent le temps sans rien perdre de leur éclat.",
      content:
        "Un vêtement d'exception est fait pour durer et raconter une histoire au fil des générations. Pourtant, la délicatesse des fibres naturelles exige une attention respectueuse et des gestes précis.\n\nLe lavage à la main à eau tiède, l'usage d'un savon neutre sans enzymes agressives, le séchage à plat à l'abri du soleil direct : autant de rituels qui préservent la structure des fibres et l'éclat des pigments naturels. Pour le repassage, privilégiez toujours une pattemouille légèrement humide et une chaleur douce sur l'envers du tissu.",
      publishedAt: new Date('2026-02-28T00:00:00.000Z'),
      photo: '1489987707025-afc232f7ea0f',
      photoAlt: 'Pliage méticuleux de textiles nobles et soies naturelles',
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
      slug: 'vodiondry-haute-couture-tradition-et-modernite',
      title: "Le Vodiondry réinventé : L'élégance de la tradition sublimée",
      categoryId: mariageMadagascar.id,
      excerpt:
        "Comment marier l'émotion des fiançailles traditionnelles malgaches avec les codes d'une haute couture contemporaine et intemporelle.",
      content:
        "Le Vodiondry est un moment d'une rare intensité émotionnelle dans la vie d'une famille malgache. Il réunit deux lignées dans le respect des coutumes et l'échange des paroles sacrées.\n\nPour cette cérémonie, la tenue de la future mariée doit allier modestie, solennité et grâce. La Maison ANGALY conçoit des pièces inspirées des drapés traditionnels, travaillées dans des soies légères et rehaussées de broderies dorées délicates qui célèbrent notre patrimoine sans jamais figer la création dans le passé.",
      publishedAt: new Date('2026-02-15T00:00:00.000Z'),
      photo: '1519741497674-611481863552',
      photoAlt: 'Célébration de mariage élégante avec parures et étoffes raffinées',
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
      slug: 'secret-des-broderies-main-patrimoine-vivant',
      title: "Le geste et l'aiguille : L'art séculaire de la broderie à la main",
      categoryId: coulissesAtelier.id,
      excerpt:
        "Immersion aux côtés de nos artisanes brodeuses à Antananarivo, gardiennes d'un savoir-faire virtuose transmis de mère en fille.",
      content:
        "Sous la verrière de notre atelier principal, le silence n'est troublé que par le souffle régulier des brodeuses et le passage soyeux du fil à travers le tissu.\n\nChaque pétale, chaque relief est composé point par point, nécessitant parfois plus de deux cents heures d'un labeur qui tient de la méditation. Ce travail d'orfèvre donne à chaque robe une âme unique, impossible à reproduire par une machine.",
      publishedAt: new Date('2026-02-05T00:00:00.000Z'),
      photo: '1558769132-cb1aea458c5e',
      photoAlt: "Artisane concentrée brodant un motif floral sur une pièce d'atelier",
    },
    {
      slug: 'choisir-ses-accessoires-pour-une-soiree-de-gala',
      title: "L'art du détail : Comment accessoiriser une robe d'exception",
      categoryId: conseilsMode.id,
      excerpt:
        "Pochette sculpturale, bijoux discrets et souliers sur-mesure : les principes fondamentaux pour parfaire une silhouette sans la surcharger.",
      content:
        "Une robe haute couture se suffit souvent à elle-même, mais le choix des accessoires en révèle toute la subtilité.\n\nLorsque la robe arbore des détails complexes de broderie ou de perlage, les bijoux doivent s'effacer : une simple boucle d'oreille en perle naturelle ou un bracelet d'or fin suffisent. À l'inverse, une coupe épurée en satin unicolore invite un bijou sculptural affirmé pour créer un point focal captivant.",
      publishedAt: new Date('2026-01-30T00:00:00.000Z'),
      photo: '1515886657613-9f3515b0c78f',
      photoAlt: 'Accessoires de luxe et silhouette de soirée aux finitions soignées',
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
      slug: 'choisir-le-tissu-ideal-costume-tropical',
      title: 'Lin, laine froide et mélanges soie : Le costume sous le climat malgache',
      categoryId: conseilsCostume.id,
      excerpt:
        'Nos recommandations de maîtres tailleurs pour allier confort thermique absolu et tenue impeccable lors des réceptions en plein air.',
      content:
        "Concevoir un costume élégant sous les latitudes tropicales est un défi de coupe et de matière. La laine froide haute torsion (Fresco) et les mélanges lin-soie offrent une respirabilité remarquable tout en conservant une ligne nette et sans faux plis.\n\nNos tailleurs recommandent également une construction semi-entoilée plus légère, qui épouse le corps naturellement sans l'alourdir, même aux heures les plus chaudes des célébrations.",
      publishedAt: new Date('2026-01-18T00:00:00.000Z'),
      photo: '1594938298603-c8148c4dae35',
      photoAlt: "Nuancier d'étoffes nobles et finitions intérieures d'une veste de costume",
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
    // --- Mariage à Madagascar (ajouts supplémentaires) ---
    {
      slug: 'choisir-sa-robe-mariage-civil-vs-religieux',
      title: 'Mariage civil et mariage religieux : Comment harmoniser vos deux tenues',
      categoryId: mariageMadagascar.id,
      excerpt:
        'Entre la solennité de la mairie et la grandeur de la cérémonie religieuse, nos conseils de stylistes pour choisir deux tenues complémentaires sans fausse note.',
      content:
        "Célébrer son mariage à Madagascar implique fréquemment deux temps forts distincts : le passage civil devant monsieur le Maire et la bénédiction nuptiale à l'église. Deux atmosphères, deux exigences de style.\n\nPour la cérémonie civile, nous préconisons souvent une silhouette tailleur pantalon en crêpe de soie ou une robe midi structurée aux accents contemporains. Pour l'église, la majesté d'une robe longue à traîne et dentelle prend tout son sens. L'art réside dans la continuité d'un fil conducteur — une nuance d'ivoire partagée, un bijou de famille récurrent ou une broderie hommage.",
      publishedAt: new Date('2026-03-03T00:00:00.000Z'),
      photo: '1465495976277-4387d4b0b4c6',
      photoAlt: 'Couple de mariés élégant lors d’une cérémonie romantique',
    },
    {
      slug: 'les-fleurs-de-madagascar-dans-votre-bouquet-et-parure',
      title: "Orchidées et flore de l'Île Rouge : Sublimer son cortège nuptial",
      categoryId: mariageMadagascar.id,
      excerpt:
        "L'art d'intégrer les espèces florales endémiques de Madagascar dans les accessoires de coiffure, boutonnières et décors de réception.",
      content:
        "La richesse botanique de Madagascar offre une source d'inspiration inépuisable pour la scénographie florale d'un mariage de prestige.\n\nL'orchidée Angraecum sesquipedale (l'étoile de Madagascar), aux pétales cireux d'un blanc immaculé et au parfum envoûtant à la tombée du jour, s'accorde merveilleusement avec la pureté des soies ANGALY. Délicatement piquée dans une coiffure sculptée ou reprise en motif de broderie sur le voile, elle scelle l'ancrage précieux de votre union dans la terre malgache.",
      publishedAt: new Date('2026-02-12T00:00:00.000Z'),
      photo: '1544078751-58fee2d8a03b',
      photoAlt: 'Compositions florales et parures délicates de mariage',
    },
    // --- Conseils mode (ajouts supplémentaires) ---
    {
      slug: 'silhouette-et-morphologie-trouver-la-coupe-ideale',
      title: 'Morphologie et haute couture : Trouver la coupe qui magnifie vos atouts',
      categoryId: conseilsMode.id,
      excerpt:
        "Taille cintrée, décolleté plongeant ou ligne trapèze : comprendre l'architecture d'une robe pour équilibrer parfaitement les proportions.",
      content:
        "La haute couture ne cherche pas à adapter un corps à un vêtement, mais à concevoir une architecture textile qui dialogue intimement avec chaque silhouette.\n\nQu'il s'agisse d'allonger la jambe par une taille subtilement surélevée, de souligner le port de tête grâce à un col montant asymétrique ou d'adoucir les hanches avec un plissé soleil en organza, chaque décision de coupe répond à des lois géométriques strictes. Nos essayages sur toile permettent d'ajuster chaque millimètre avant la découpe définitive de l'étoffe précieuse.",
      publishedAt: new Date('2026-02-24T00:00:00.000Z'),
      photo: '1496747611176-843222e1e57c',
      photoAlt: 'Drapé haute couture sur mannequin d’atelier',
    },
    {
      slug: 'palette-de-couleurs-carnation-sublimer-le-teint',
      title: 'La colorimétrie selon ANGALY : Quelles teintes pour votre carnation ?',
      categoryId: conseilsMode.id,
      excerpt:
        'Champagne, ivoire chaud, blanc pur ou bleu nuit : comment identifier les reflets de tissus qui illumineront naturellement votre visage.',
      content:
        "L'éclat d'une tenue dépend autant de sa coupe que de la résonance entre la couleur du tissu et la carnation de celle qui le porte.\n\nPour les peaux aux sous-tons chauds ou dorés, les soies champagne, vanille et sable chaud captent la lumière avec une douceur flatteuse. Les carnations aux nuances fraîches ou très contrastées rayonneront au contact de notre bleu nuit profond ou d'un blanc glacier immaculé. Lors de la première consultation en salon privé, nos stylistes testent plusieurs échantillons d'étoffes à la lumière naturelle pour révéler votre nuance idéale.",
      publishedAt: new Date('2026-01-22T00:00:00.000Z'),
      photo: '1539109136881-3be0616acf4b',
      photoAlt: 'Nuances de tissus et palette de couleurs haute couture',
    },
    // --- Conseils costume (ajouts supplémentaires) ---
    {
      slug: 'gilet-cravate-ou-noeud-papillon-le-guide-du-marie',
      title: 'Cravate, lavallière ou nœud papillon : Choisir ses accessoires de marié',
      categoryId: conseilsCostume.id,
      excerpt:
        "Guide complet des règles d'élégance masculine pour accessoiriser avec distinction un costume trois pièces ou un smoking d'apparat.",
      content:
        "Les détails font la distinction du marié. Si la coupe de la veste et le tombé du pantalon constituent les fondations de l'allure, le choix du tour de cou en dicte le registre stylistique.\n\nLe nœud papillon en satin de soie noir ou midnight blue demeure le complice indissociable du smoking pour les soirées black tie. Pour une célébration de jour plus champêtre ou romantique, une cravate étroite en grenadine de soie ou une lavallière souple apporte une touche aristocratique sans ostentation. Le gilet croisé contrasté, quant à lui, sculpte le buste dès que la veste est retirée.",
      publishedAt: new Date('2026-02-18T00:00:00.000Z'),
      photo: '1593032465175-481ac7f401a0',
      photoAlt: 'Finitions impeccables et accessoires d’un costume trois pièces',
    },
    {
      slug: 'les-souliers-du-gentleman-richelieu-ou-derby',
      title: 'Richelieu, Derby ou Mocassins : Le guide des souliers de cérémonie',
      categoryId: conseilsCostume.id,
      excerpt:
        'Cuir patiné, montage Blake ou cousu Goodyear : investir dans des souliers nobles capables de compléter avec grâce un costume sur-mesure.',
      content:
        "Une tenue masculine impeccable ne saurait tolérer une hésitation au niveau des souliers. Le Richelieu à empeigne lisse ou plastron one-cut représente le summum du formalisme pour le marié : son laçage fermé prolonge la pureté de la jambe du pantalon sans rupture visuelle.\n\nLe Derby, avec ses garants ouverts, convient parfaitement aux morphologies de pied plus fortes et aux costumes de ville décontractés. Enfin, pour les réceptions en bord de mer ou dans un domaine ensoleillé, le mocassin à pampilles en cuir suédé offre une décontraction sophistiquée incomparable.",
      publishedAt: new Date('2026-01-05T00:00:00.000Z'),
      photo: '1617137984095-74e4e5e3613f',
      photoAlt: 'Paire de souliers Richelieu en cuir patiné artisanal',
    },
    // --- Tendances (ajouts supplémentaires) ---
    {
      slug: 'le-retour-de-la-cape-et-de-la-traine-amovible',
      title: "Capes fluides et traînes amovibles : La polyvalence couture s'impose",
      categoryId: tendances.id,
      excerpt:
        "Passer d'une entrée magistrale à une liberté de mouvement totale pour la soirée : la traîne amovible s'affirme comme l'incontournable de 2026.",
      content:
        "Les mariées contemporaines ne souhaitent plus sacrifier la fête au cérémonial. La réponse de nos ateliers réside dans la modularité haute couture.\n\nFixée par d'invisibles petits boutons de nacre sous un ruché de dentelle, la traîne majestueuse de trois mètres se détache en un geste après la cérémonie religieuse. La mariée dévoile ainsi une silhouette fluide et dansante pour la réception, sans avoir eu besoin de changer entièrement de tenue.",
      publishedAt: new Date('2026-02-26T00:00:00.000Z'),
      photo: '1509631179647-0177331693ae',
      photoAlt: 'Robe de mariée contemporaine avec cape vaporeuse en mouvement',
    },
    {
      slug: 'transparences-et-jeux-d-organza-l-audace-subtile',
      title: "Transparences maîtrisées : L'organza et le tulle réinventent la robe du soir",
      categoryId: tendances.id,
      excerpt:
        "Comment les jeux de superposition et les transparences architecturales insufflent de la modernité aux tenues d'apparat sans compromettre la pudeur.",
      content:
        "Travailler la transparence en haute couture relève d'une alchimie complexe : suggérer la lumière sans tout dévoiler, créer de la profondeur sans alourdir.\n\nEn superposant des couches successives d'organza de soie fumé et de gaze de lin ultra-fine, nos créateurs façonnent des effets de moirage envoûtants. Les bustiers illusion, ornés de nervures minutieusement appliquées à la main, semblent flotter directement sur la peau comme un tatouage textile précieux.",
      publishedAt: new Date('2026-01-15T00:00:00.000Z'),
      photo: '1512436991641-6745cdb1723f',
      photoAlt: 'Jeux de matières transparentes et reflets soyeux sur silhouette de gala',
    },
    // --- Coulisses de l'atelier (ajouts supplémentaires) ---
    {
      slug: 'naissance-d-un-croquis-de-l-idee-au-dessin',
      title: "De l'esquisse au patron : Dans le carnet de notre directrice artistique",
      categoryId: coulissesAtelier.id,
      excerpt:
        "Chaque chef-d'œuvre commence par un coup de crayon. Découvrez les coulisses créatives où naissent les premières esquisses de nos collections.",
      content:
        "Avant le premier coup de ciseaux dans la toile à patronner, il y a l'intimité du carnet à croquis. C'est là que se cristallisent les inspirations : les nervures d'une feuille de ravinala, le souvenir d'une façade coloniale d'Ambohimanga, le bruissement d'une mousseline au vent du soir.\n\nLe croquis fixe les proportions, les points de tension et le mouvement souhaité. Transmis aux modélistes, ce dessin devient un tracé géométrique précis, première étape d'une longue métamorphose vers la réalité de l'étoffe.",
      publishedAt: new Date('2026-02-02T00:00:00.000Z'),
      photo: '1544816155-12df9643f363',
      photoAlt: 'Esquisse de mode dessinée à la main sur table de patronage',
    },
    {
      slug: 'la-selection-des-fils-de-soie-malgache-au-coeur-des-hauts-plateaux',
      title: "Sur la route de la soie sauvage : À la rencontre de nos fileuses de l'Imerina",
      categoryId: coulissesAtelier.id,
      excerpt:
        'Voyage au cœur des Hauts Plateaux malgaches pour sourcer les cocons de soie sauvage qui donneront vie à nos étoffes les plus précieuses.',
      content:
        "La soie sauvage malgache — le fameux landibe récolté sur les tapia — possède une texture brute et dorée qu'aucune fibre industrielle ne peut égaler.\n\nDans les villages de l'Imerina, nos partenaires perpétuent un dévidage entièrement manuel des cocons, préservant la résistance singulière du fil. En intégrant cette matière d'exception dans nos collections haute couture, la Maison ANGALY soutient un écosystème artisanal local précieux tout en offrant au monde entier un aperçu du raffinement malgache.",
      publishedAt: new Date('2026-01-08T00:00:00.000Z'),
      photo: '1503342217505-b0a15ec3261c',
      photoAlt: 'Métier à tisser artisanal et bobines de fil de soie naturelle',
    },
    // --- Entretien des vêtements (ajouts supplémentaires) ---
    {
      slug: 'stocker-et-preserver-sa-robe-de-mariee-apres-la-fete',
      title: 'Conserver sa robe de mariée : Les précautions indispensables après le grand jour',
      categoryId: entretienVetements.id,
      excerpt:
        'Boîte de conservation au pH neutre, papier de soie sans acide et nettoyage professionnel : les secrets pour transmettre votre robe intacte.',
      content:
        "La fête terminée, votre robe de mariée porte les traces heureuses d'une journée inoubliable : poussière de piste de danse, traces imperceptibles de parfum ou gouttes de champagne.\n\nIl est impératif de confier la pièce à un pressing spécialisé dans les fibres d'art sous 48 à 72 heures. Évitez absolument les housses plastiques étanches qui piègent l'humidité et provoquent le jaunissement des fibres. Rangez votre robe à plat dans un coffret de conservation garni de papier de soie sans acide, à l'abri de la lumière et des variations thermiques.",
      publishedAt: new Date('2026-02-14T00:00:00.000Z'),
      photo: '1582735689369-4fe89db7114c',
      photoAlt: 'Dressing soigné abritant des vêtements protégés dans des housses textiles',
    },
    {
      slug: 'defroisser-les-tissus-nobles-a-la-vapeur-mode-d-emploi',
      title: 'Le défroissage vertical à la vapeur : Pourquoi bannir le fer traditionnel',
      categoryId: entretienVetements.id,
      excerpt:
        'Protégez le velours de soie, la dentelle et le crêpe lourd : comment un défroisseur vapeur professionnel redonne tout son gonflant à une étoffe.',
      content:
        "Le contact direct de la semelle chaude d'un fer à repasser peut écraser irrémédiablement le poil d'un velours, faire lustrer une laine froide ou brûler les fibres sensibles d'une dentelle.\n\nLe défroissage à jet de vapeur vertical reste la méthode privilégiée par nos couturières. La vapeur d'eau douce détend les fibres en profondeur sans exercer de pression mécanique, permettant au vêtement de retrouver son tombé naturel et son volume d'origine en quelques passes légères.",
      publishedAt: new Date('2026-01-12T00:00:00.000Z'),
      photo: '1567401893414-76b7b1e5a7a5',
      photoAlt: 'Soin du linge et défroissage vertical de vêtements délicats',
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
  // --- Page Sections (Accueil / CMS) ----------------------------------------
  const pageSections = [
    {
      page: 'accueil',
      sectionKey: 'hero',
      locale: Locale.FR,
      titleText: 'ANGALY',
      subtitleText: "L'élégance, créée pour vous.",
      ctaPrimaryLabel: 'Prendre rendez-vous',
      ctaSecondaryLabel: 'Découvrir nos créations',
      dataJson: { eyebrow: 'MAISON DE COUTURE — MADAGASCAR' },
      status: ContentStatus.PUBLISHED,
      photo: '1594552072238-b8a33785b261',
      photoAlt: 'Robe de mariée haute couture Angaly',
    },
    {
      page: 'accueil',
      sectionKey: 'maison',
      locale: Locale.FR,
      titleText: 'Une maison de couture pensée pour vous.',
      subtitleText: 'NOTRE SAVOIR-FAIRE',
      bodyText:
        "Fondée au cœur de Madagascar, la Maison Angaly perpétue l'artisanat d'exception. Chaque création est le fruit d'une rencontre entre une vision, des matières nobles et le talent de nos artisans. Du croquis initial à la dernière retouche, nous donnons vie à vos rêves d'élégance avec une précision millimétrée et un dévouement absolu.",
      ctaPrimaryLabel: 'Découvrir Angaly',
      status: ContentStatus.PUBLISHED,
      photo: '1558769132-cb1aea458c5e',
      photoAlt: 'Artisans et couturières dans notre atelier',
    },
    {
      page: 'accueil',
      sectionKey: 'univers-mariage',
      locale: Locale.FR,
      titleText: 'Mariage',
      status: ContentStatus.PUBLISHED,
      photo: '1583939003579-730e3918a45a',
      photoAlt: 'Univers Robes de mariée',
    },
    {
      page: 'accueil',
      sectionKey: 'univers-costumes',
      locale: Locale.FR,
      titleText: 'Costumes',
      status: ContentStatus.PUBLISHED,
      photo: '1594938298603-c8148c4dae35',
      photoAlt: 'Univers Costumes homme sur mesure',
    },
    {
      page: 'accueil',
      sectionKey: 'univers-soiree',
      locale: Locale.FR,
      titleText: 'Soirée',
      status: ContentStatus.PUBLISHED,
      photo: '1566174053879-31528523f8ae',
      photoAlt: 'Univers Robes de soirée',
    },
    {
      page: 'accueil',
      sectionKey: 'univers-sur-mesure',
      locale: Locale.FR,
      titleText: 'Sur Mesure',
      status: ContentStatus.PUBLISHED,
      photo: '1520006403909-838d6b92c22e',
      photoAlt: 'Univers Confection sur mesure',
    },
    {
      page: 'accueil',
      sectionKey: 'pattern-studio',
      locale: Locale.FR,
      titleText: 'Angaly Pattern Studio',
      subtitleText: 'SERVICE EXCLUSIF',
      bodyText:
        "Découvrez notre atelier virtuel propulsé par l'IA. Visualisez vos idées, testez des coupes audacieuses et collaborez en temps réel avec nos maîtres tailleurs avant même le premier coup de ciseaux.",
      ctaPrimaryLabel: 'Explorer le Studio',
      status: ContentStatus.PUBLISHED,
      photo: '1509631179647-0177331693ae',
      photoAlt: 'Atelier de création virtuelle et patronage Angaly Pattern Studio',
    },
    // --- Page Sections (À Propos / Héritage) ---------------------------------
    {
      page: 'a-propos',
      sectionKey: 'hero',
      locale: Locale.FR,
      titleText: 'Notre histoire',
      subtitleText: 'Une maison de couture née à Madagascar, pensée pour durer.',
      status: ContentStatus.PUBLISHED,
      photo:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAot6Ae0jR3beKh6XaoU4Z5CCsF7dTJhjc9vU3CWjSmBhpMzxvMXuuPfInfT4sUAo5-zYPok6ZdthlmuzuHx1VGRLFRxWGBWFEKeH0FLGrcgdOe5q32QuaOXvtL3AHlfRk4twGO4aejz9XHMlPttIlSguOwx6VGvTm9Ll8n9Gp8Zd92FLsYssTRP786R5vqdMupzxfECxQ1BGaX0S33hyij-lCr4wGt_lLDWTXObrnaJW9zoX6vWm-xQmR-jNcFQmeTZNRNdfOswOs',
      photoAlt: 'Atelier de couture Angaly à Madagascar, étoffes de soie drapées à la lumière dorée',
    },
    {
      page: 'a-propos',
      sectionKey: 'histoire',
      locale: Locale.FR,
      titleText: 'Comment tout a commencé',
      bodyText:
        "Fondée au cœur d'Antananarivo, la maison ANGALY est née d'une passion pour l'élégance intemporelle et le savoir-faire méticuleux. Dès nos premiers pas, nous avons cherché à marier l'héritage riche de Madagascar avec les exigences de la haute couture internationale.\n\nChaque création raconte une histoire, celle de mains expertes, de matières nobles sélectionnées avec rigueur, et d'une vision où le vêtement devient une œuvre d'art portée.",
      dataJson: {
        chronology: [
          { year: '1998', title: 'La première esquisse', description: "L'ouverture de notre premier atelier confidentiel." },
          { year: '2010', title: "L'expansion", description: 'Reconnaissance nationale et premières collections sur-mesure.' },
        ],
      },
      status: ContentStatus.PUBLISHED,
      photo:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDE2e9E-bdCP0RbNDfvhhRxSPU9UQ6m9WN1HsYCbZSYub6ucWhuLWD2zoD5N6M9PIuy9_Raneh6af53_bTM4_a-9f7wqRg1IohzneW_YAayZ5pLWFHnWxldZXMSk0d2BapF-0-PT5cXGePJzENJknt8YaGdJjFrKQ4V_kdHEO4cg4SL22b_NSYmH950bm_xCjrdflV3CzXVx_O5L0yp6nb_YFDllisQSdoX0ynfwFzXRJFUdDATwtb39wUy-4kfPztD1h_iJmEjB1c',
      photoAlt: 'Machine à coudre Singer patrimoniale sur table en bois d’atelier d’origine',
    },
    {
      page: 'a-propos',
      sectionKey: 'fondatrice',
      locale: Locale.FR,
      titleText: 'Qui est Angaly ?',
      subtitleText: "L'âme de la maison",
      bodyText:
        "Visionnaire et artisane dans l'âme, Angaly a toujours cru que la véritable beauté réside dans les détails imperceptibles. Formée aux techniques traditionnelles et influencée par l'architecture moderne, elle insuffle à chaque collection une dualité unique : force et délicatesse, rigueur et fluidité.",
      dataJson: {
        quote: "Un vêtement n'est pas qu'une parure, c'est une architecture intime qui révèle la personne qui le porte.",
      },
      status: ContentStatus.PUBLISHED,
      photo:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC_t5pljMy3LwQA1SNjDkwgqtH-e_Skx84P4VoMDSReKm2Q0gmpsLzRCsnlpvu3XdWw8Ctmj6sV9s4jsPZPbU9cNUuy_6bYHRAnCMS05nzz3R8h9_Ot2gfG6Bnhk3xxDlrjV8aMJBvMl_zILsPbToQahuSrEU1f03xREtX395GBWXUvEmVTcoJfLiPKyyl9G5OY9fHRHS2FPoiY3NE7aNjP1yoDK2gPqgRttpkw9S1uuaIO5pRhlwfqag8TSszSWFGc-F4ZDRftY08',
      photoAlt: 'Portrait de Madame Angaly, fondatrice et directrice artistique de la maison',
    },
    {
      page: 'a-propos',
      sectionKey: 'savoir-faire',
      locale: Locale.FR,
      titleText: 'Notre Savoir-Faire',
      subtitleText: 'L’excellence de la haute couture malgache, cultivée dans nos ateliers.',
      dataJson: {
        items: [
          {
            title: 'Couture main',
            description: 'Chaque point est une promesse de durabilité.',
            imageUrl:
              'https://lh3.googleusercontent.com/aida-public/AB6AXuBjm-f1cfDol4QbcrMhpOB6hy_14AI-xx6mWsRmYHsR9Ask6MdX4JngzGE3urBzJ5rVAv7unZ8TJ4Me9ljuPd-Pg4Zyq6C5av-MJ7bfve8gE5KPl7AeHTYzq3E2zIoz9f94Khn4_ulbODiknQ66r46N8yyMxOxXoEkteF_uoTsnSK6hmmFuhhCIPlwtROPwDQvhXK4Q8oZfanLfllVppL3z768awAGVLSE9R5hHYvBttbHq558JoLeOsdIAdsYqNvxwhR8DVEmQwWc',
            icon: null,
          },
          {
            title: 'Patronage sur mesure',
            description: "L'architecture parfaite pour épouser la silhouette.",
            imageUrl:
              'https://lh3.googleusercontent.com/aida-public/AB6AXuBL_TANP845e5gFup5POkuvcgUUh6LiKPujdrhEa41kkZwKY-QS1Zkf5T9UwBKxkPcsfV37QYg6jwFm90s4RxXtdxj0wY1_RGES0jMkfhJzptV7eaONCI-FWEu_2KD_kU7PJBlGi458mlKYPIXM2CsSh81cqDMtzzqKPY9gFj8ZF7xFegQm67YOInK6918d-BDg4hhmL7Bht2igNrkAS4Kp709Tgio7EcwHXtSjiLObpfA-uVzAw-7sA7ZQ22wN_iXl09ur6tRiGLY',
            icon: null,
          },
          {
            title: 'Broderie',
            description: 'Des motifs exclusifs, dessinés et brodés à la main.',
            imageUrl: null,
            icon: 'draw',
          },
          {
            title: 'Finitions artisanales',
            description: 'L’invisible perfection qui signe une grande pièce.',
            imageUrl: null,
            icon: 'cut',
          },
        ],
      },
      status: ContentStatus.PUBLISHED,
      photo:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBjm-f1cfDol4QbcrMhpOB6hy_14AI-xx6mWsRmYHsR9Ask6MdX4JngzGE3urBzJ5rVAv7unZ8TJ4Me9ljuPd-Pg4Zyq6C5av-MJ7bfve8gE5KPl7AeHTYzq3E2zIoz9f94Khn4_ulbODiknQ66r46N8yyMxOxXoEkteF_uoTsnSK6hmmFuhhCIPlwtROPwDQvhXK4Q8oZfanLfllVppL3z768awAGVLSE9R5hHYvBttbHq558JoLeOsdIAdsYqNvxwhR8DVEmQwWc',
      photoAlt: 'Mains d’artisan brodant minutieusement des motifs dorés sur soie',
    },
    {
      page: 'a-propos',
      sectionKey: 'philosophie',
      locale: Locale.FR,
      bodyText:
        "Nous ne créons pas de la mode pour l'instant présent, nous forgeons des héritages de soie et de lin pour les générations futures.",
      status: ContentStatus.PUBLISHED,
    },
    {
      page: 'a-propos',
      sectionKey: 'atelier',
      locale: Locale.FR,
      titleText: "L'Atelier",
      subtitleText: 'Dans les coulisses de la création',
      dataJson: {
        items: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1641293498376-139cfe50ff67?w=1600&q=80',
            icon: null,
            label: null,
            size: 'large',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1771098206650-81d713e2e2b9?w=1000&q=80',
            icon: null,
            label: null,
            size: 'default',
          },
          {
            imageUrl: null,
            icon: 'styler',
            label: 'Matières Nobles',
            size: 'default',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1676893140066-df87af3bc566?w=1000&q=80',
            icon: null,
            label: null,
            size: 'default',
          },
        ],
      },
      status: ContentStatus.PUBLISHED,
      photo: '1641293498376-139cfe50ff67',
      photoAlt: 'Établi de coupe et draperie artisanale au cœur de l’atelier Angaly',
    },
    {
      page: 'a-propos',
      sectionKey: 'vision',
      locale: Locale.FR,
      titleText: "Incarnez l'élégance",
      bodyText: 'Découvrez des pièces uniques où chaque détail a été pensé pour sublimer votre allure.',
      ctaPrimaryLabel: 'Découvrir nos créations',
      ctaSecondaryLabel: 'Prendre rendez-vous',
      status: ContentStatus.PUBLISHED,
    },
  ];

  const createdPageSections = new Map<string, { id: string }>();
  for (const { photo: _photo, photoAlt: _photoAlt, ...sectionData } of pageSections) {
    const section = await prisma.pageSection.upsert({
      where: {
        page_sectionKey_locale: {
          page: sectionData.page,
          sectionKey: sectionData.sectionKey,
          locale: sectionData.locale,
        },
      },
      update: sectionData,
      create: { ...sectionData, updatedById: adminUser.id },
    });
    createdPageSections.set(`${section.page}:${section.sectionKey}`, section);
  }
  console.log(`✅ ${pageSections.length} sections de page (Accueil et À propos) créées`);

  // --- Testimonials ---------------------------------------------------------
  const testimonials = [
    {
      customerName: 'Nirina',
      creationLabel: 'Robe de mariée — Collection Éternelle',
      quote: 'Angaly a su donner vie à la robe dont je rêvais depuis toujours.',
      isVerified: true,
      isPublished: true,
      photo: '1534528741775-53994a69daeb',
      photoAlt: 'Nirina — Témoignage cliente',
    },
    {
      customerName: 'Hery',
      creationLabel: 'Costume sur mesure',
      quote: 'Un savoir-faire rare et une écoute attentive à chaque étape.',
      isVerified: true,
      isPublished: true,
      photo: '1507003211169-0a1dd7228f2d',
      photoAlt: 'Hery — Témoignage client',
    },
    {
      customerName: 'Fara',
      creationLabel: 'Robe de soirée',
      quote: "Une élégance intemporelle, exactement ce que j'imaginais.",
      isVerified: false,
      isPublished: true,
      photo: '1517841905240-472988babdf9',
      photoAlt: 'Fara — Témoignage cliente',
    },
  ];

  const createdTestimonials: Array<{ id: string; photo: string; photoAlt: string }> = [];
  for (const item of testimonials) {
    const existing = await prisma.testimonial.findFirst({
      where: { customerName: item.customerName, quote: item.quote },
    });
    const record =
      existing ??
      (await prisma.testimonial.create({
        data: {
          customerName: item.customerName,
          creationLabel: item.creationLabel,
          quote: item.quote,
          isVerified: item.isVerified,
          isPublished: item.isPublished,
        },
      }));
    createdTestimonials.push({ id: record.id, photo: item.photo, photoAlt: item.photoAlt });
  }
  console.log(`✅ ${testimonials.length} témoignages créés`);

  // --- Utilisateur Client (Test) et Pattern Studio --------------------------
  const clientPasswordHash = await bcrypt.hash('Client@Angaly2026!', 12);
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@angaly.mg' },
    update: {},
    create: {
      email: 'client@angaly.mg',
      passwordHash: clientPasswordHash,
      role: Role.CLIENT,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      firstName: 'Jeanne',
      lastName: 'Dupont',
      phone: '+261 34 00 000 00',
    },
  });
  console.log('✅ Client user ready (client@angaly.mg)');

  const profileCount = await prisma.measurementProfile.count({ where: { customerId: customer.id } });
  if (profileCount === 0) {
    const profile = await prisma.measurementProfile.create({
      data: {
        customerId: customer.id,
        label: 'Mesures Principales',
        values: {
          create: [
            { key: 'TOUR_POITRINE', valueCm: 90 },
            { key: 'TOUR_TAILLE', valueCm: 70 },
            { key: 'TOUR_BASSIN', valueCm: 95 },
            { key: 'LONGUEUR_BRAS', valueCm: 60 },
            { key: 'CARRURE_DOS', valueCm: 38 },
          ],
        },
      },
    });

    const patternProjectsData = [
      {
        projectRef: 'ANG-PAT-2026-00001',
        garmentType: 'Robe de mariée',
        occasion: 'Mariage',
        style: 'Sirène',
        status: 'VALIDATED' as any,
        versions: [
          {
            versionNumber: 1,
            parametersJson: { fit: 'tight', neckline: 'v-neck', sleeve: 'none' },
            generatedByAI: true,
            pieces: [
              { name: 'Corsage Devant', dimensionsJson: { width: 45, length: 40 }, quantity: 1, fabricRecommendation: 'Satin Duchesse' },
              { name: 'Corsage Dos', dimensionsJson: { width: 45, length: 40 }, quantity: 2, fabricRecommendation: 'Satin Duchesse' },
              { name: 'Jupe Devant', dimensionsJson: { width: 70, length: 110 }, quantity: 1, fabricRecommendation: 'Tulle' },
              { name: 'Jupe Dos avec traîne', dimensionsJson: { width: 90, length: 150 }, quantity: 2, fabricRecommendation: 'Tulle' },
            ],
          },
        ],
      },
      {
        projectRef: 'ANG-PAT-2026-00002',
        garmentType: 'Costume 3 pièces',
        occasion: 'Gala',
        style: 'Slim fit',
        status: 'GENERATED' as any,
        versions: [
          {
            versionNumber: 1,
            parametersJson: { fit: 'slim', lapel: 'peak', vents: 'double' },
            generatedByAI: true,
            pieces: [
              { name: 'Veste Devant', dimensionsJson: { width: 35, length: 75 }, quantity: 2, fabricRecommendation: 'Laine Super 150s' },
              { name: 'Veste Dos', dimensionsJson: { width: 40, length: 75 }, quantity: 1, fabricRecommendation: 'Laine Super 150s' },
              { name: 'Manche', dimensionsJson: { width: 25, length: 65 }, quantity: 2, fabricRecommendation: 'Laine Super 150s' },
              { name: 'Pantalon Devant', dimensionsJson: { width: 30, length: 105 }, quantity: 2, fabricRecommendation: 'Laine Super 150s' },
              { name: 'Pantalon Dos', dimensionsJson: { width: 35, length: 105 }, quantity: 2, fabricRecommendation: 'Laine Super 150s' },
            ],
          },
        ],
      },
      {
        projectRef: 'ANG-PAT-2026-00003',
        garmentType: 'Robe de cocktail',
        occasion: 'Soirée',
        style: 'Asymétrique',
        status: 'DRAFT' as any,
        versions: [
          {
            versionNumber: 1,
            parametersJson: { fit: 'regular', length: 'midi' },
            generatedByAI: true,
            pieces: [
              { name: 'Devant Asymétrique', dimensionsJson: { width: 50, length: 90 }, quantity: 1, fabricRecommendation: 'Soie' },
              { name: 'Dos', dimensionsJson: { width: 45, length: 90 }, quantity: 2, fabricRecommendation: 'Soie' },
            ],
          },
        ],
      },
      {
        projectRef: 'ANG-PAT-2026-00004',
        garmentType: 'Chemise Sur Mesure',
        occasion: 'Business',
        style: 'Classique',
        status: 'REVIEW_REQUIRED' as any,
        versions: [
          {
            versionNumber: 1,
            parametersJson: { fit: 'regular', collar: 'cutaway', cuff: 'french' },
            generatedByAI: true,
            pieces: [
              { name: 'Devant Gauche', dimensionsJson: { width: 30, length: 80 }, quantity: 1, fabricRecommendation: 'Popeline de coton' },
              { name: 'Devant Droit', dimensionsJson: { width: 30, length: 80 }, quantity: 1, fabricRecommendation: 'Popeline de coton' },
              { name: 'Dos', dimensionsJson: { width: 50, length: 82 }, quantity: 1, fabricRecommendation: 'Popeline de coton' },
              { name: 'Col', dimensionsJson: { width: 45, length: 10 }, quantity: 2, fabricRecommendation: 'Popeline de coton' },
              { name: 'Manche', dimensionsJson: { width: 25, length: 65 }, quantity: 2, fabricRecommendation: 'Popeline de coton' },
            ],
          },
        ],
      },
    ];

    for (const data of patternProjectsData) {
      await prisma.patternProject.create({
        data: {
          projectRef: data.projectRef,
          customerId: customer.id,
          measurementProfileId: profile.id,
          garmentType: data.garmentType,
          occasion: data.occasion,
          style: data.style,
          status: data.status,
          versions: {
            create: data.versions.map((v) => ({
              versionNumber: v.versionNumber,
              parametersJson: v.parametersJson,
              generatedByAI: v.generatedByAI,
              pieces: {
                create: v.pieces,
              },
            })),
          },
        },
      });
    }
    console.log(`✅ ${patternProjectsData.length} projets Pattern Studio créés pour le client test`);
  }

  // --- Media (real free stock photos uploaded to MinIO) ---------------------
  // See docs/pages/*.md "Points d'attention" for the "no real photography yet"
  // caveat this resolves — free, verified Unsplash photos (plain
  // images.unsplash.com/photo-*, never the paid plus.unsplash.com tier),
  // downloaded once and re-hosted via @angaly/storage per .cursor/rules/009-storage-minio.mdc
  // (rule 21: all media through MinIO, never a bare external URL in the DB).
  try {
    const storage = createStorageClientFromEnv();
    await storage.ensureBuckets();

    for (const { slug, photo, photoAlt } of creations) {
      const creation = createdCreations.get(slug);
      if (!creation) continue;
      const exists = await prisma.media.findFirst({
        where: { entityType: MediaEntityType.CREATION, entityId: creation.id },
      });
      if (!exists) {
        await attachPhoto(storage, 'creations', photo, photoAlt, MediaEntityType.CREATION, creation.id);
      }
    }
    console.log('✅ Photos des créations vérifiées/hébergées sur MinIO');

    const hasCollectionMedia = await prisma.media.findFirst({ where: { entityType: MediaEntityType.COLLECTION } });
    if (!hasCollectionMedia) {
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
    }

    for (const atelierItem of ateliersData) {
      const dbAtelier = createdAteliers.get(atelierItem.slug);
      if (!dbAtelier) continue;
      for (let i = 0; i < atelierItem.photos.length; i++) {
        const p = atelierItem.photos[i]!;
        const exists = await prisma.media.findFirst({
          where: { entityType: MediaEntityType.ATELIER, entityId: dbAtelier.id, sortOrder: i },
        });
        if (!exists) {
          await attachPhoto(storage, 'ateliers', p.photo, p.alt, MediaEntityType.ATELIER, dbAtelier.id, i);
        }
      }
    }
    console.log("✅ Photos de tous les ateliers vérifiées/hébergées sur MinIO");

    for (const { slug, photo, photoAlt } of blogPosts) {
      const post = createdBlogPosts.get(slug);
      if (!post) continue;
      const exists = await prisma.media.findFirst({
        where: { entityType: MediaEntityType.BLOG_POST, entityId: post.id },
      });
      if (!exists) {
        await attachPhoto(storage, 'blog', photo, photoAlt, MediaEntityType.BLOG_POST, post.id);
      }
    }
    console.log('✅ Photos des articles de journal vérifiées/hébergées sur MinIO');

    for (const { page, sectionKey, photo, photoAlt } of pageSections) {
      if (!photo) continue;
      const section = createdPageSections.get(`${page}:${sectionKey}`);
      if (!section) continue;
      const existing = await prisma.media.findFirst({
        where: { entityType: MediaEntityType.PAGE_SECTION, entityId: section.id },
      });
      // If no media or photo changed (e.g. pattern-studio updated photo), re-upload
      if (!existing) {
        await attachPhoto(storage, 'customers', photo, photoAlt, MediaEntityType.PAGE_SECTION, section.id);
      } else if (sectionKey === 'pattern-studio' && !existing.objectKey.includes(photo)) {
        await prisma.media.delete({ where: { id: existing.id } });
        await attachPhoto(storage, 'customers', photo, photoAlt, MediaEntityType.PAGE_SECTION, section.id);
      }
    }
    console.log("✅ Photos des sections de page (Accueil et À propos) vérifiées/hébergées sur MinIO");

    for (const t of createdTestimonials) {
      const exists = await prisma.media.findFirst({
        where: { entityType: MediaEntityType.CUSTOMER_AVATAR, entityId: t.id },
      });
      if (!exists) {
        await attachPhoto(storage, 'avatars', t.photo, t.photoAlt, MediaEntityType.CUSTOMER_AVATAR, t.id);
      }
    }
    console.log('✅ Avatars des témoignages vérifiés/hébergés sur MinIO');

    for (const { slug, photo, photoAlt } of products) {
      const product = createdProducts.get(slug);
      if (!product) continue;
      const exists = await prisma.media.findFirst({
        where: { entityType: MediaEntityType.PRODUCT, entityId: product.id },
      });
      if (!exists) {
        await attachPhoto(storage, 'products', photo, photoAlt, MediaEntityType.PRODUCT, product.id);
      }
    }
    console.log('✅ Photos des produits prêt-à-porter vérifiées/hébergées sur MinIO');

    for (const { slug, colorPhotos } of products) {
      for (const { color, photo, photoAlt } of colorPhotos) {
        const variantIds = variantIdsByProductColor.get(`${slug}::${color}`) ?? [];
        if (variantIds.length === 0) continue;
        const [ownerVariantId] = variantIds;
        const exists = await prisma.media.findFirst({
          where: { entityType: MediaEntityType.PRODUCT_VARIANT, entityId: ownerVariantId },
        });
        if (!exists) {
          await attachVariantColorPhoto(storage, photo, photoAlt, ownerVariantId!, variantIds);
        }
      }
    }
    console.log('✅ Photos par couleur des variantes prêt-à-porter vérifiées/hébergées sur MinIO');
  } catch (error) {
    console.warn(
      '⚠️  Seed média ignoré (MinIO ou réseau indisponible) — les pages afficheront des dégradés de substitution.',
      error instanceof Error ? error.message : error,
    );
  }

  console.log('🌱 Seed terminé.');
}

async function downloadPhoto(photoSource: string): Promise<Buffer> {
  const url =
    photoSource.startsWith('http://') || photoSource.startsWith('https://')
      ? photoSource
      : `https://images.unsplash.com/photo-${photoSource}?w=1600&q=80&fm=jpg`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Échec du téléchargement de la photo ${photoSource} : ${String(response.status)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function attachPhoto(
  storage: StorageClient,
  bucket: StorageBucketName,
  photoSource: string,
  altText: string,
  entityType: MediaEntityType,
  entityId: string,
  sortOrder = 0,
): Promise<void> {
  const buffer = await downloadPhoto(photoSource);
  const filename = photoSource.startsWith('http')
    ? `${entityId}-${sortOrder}.jpg`
    : `${photoSource}.jpg`;
  const upload = await storage.uploadBuffer(bucket, buffer, {
    originalFilename: filename,
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
          : entityType === MediaEntityType.ATELIER
            ? 'atelierRefs'
            : entityType === MediaEntityType.PAGE_SECTION
              ? 'pageSectionRefs'
              : entityType === MediaEntityType.CUSTOMER_AVATAR
                ? 'testimonialRefs'
                : entityType === MediaEntityType.PRODUCT
                  ? 'productRefs'
                  : null;

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
      ...(relationField ? { [relationField]: { connect: { id: entityId } } } : {}),
    },
  });
}

/**
 * One photo per colorway, shared by every size of that color (the
 * `_ProductVariantMedia` many-to-many) — tagged with `ownerVariantId` as its
 * `entityId` only so the idempotency check in the caller has a single row to
 * look up per color, not one per size.
 */
async function attachVariantColorPhoto(
  storage: StorageClient,
  photoSource: string,
  altText: string,
  ownerVariantId: string,
  variantIds: string[],
): Promise<void> {
  const buffer = await downloadPhoto(photoSource);
  const filename = photoSource.startsWith('http') ? `${ownerVariantId}-0.jpg` : `${photoSource}.jpg`;
  const upload = await storage.uploadBuffer('products', buffer, {
    originalFilename: filename,
    mimeType: 'image/jpeg',
    keyPrefix: ownerVariantId,
  });

  await prisma.media.create({
    data: {
      bucket: upload.bucket,
      objectKey: upload.objectKey,
      url: upload.url,
      altText,
      mimeType: 'image/jpeg',
      sizeBytes: upload.sizeBytes,
      entityType: MediaEntityType.PRODUCT_VARIANT,
      entityId: ownerVariantId,
      sortOrder: 0,
      productVariantRefs: { connect: variantIds.map((id) => ({ id })) },
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
