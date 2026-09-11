import { createStorageClientFromEnv, type StorageClient, type StorageBucketName } from '@angaly/storage';
import * as bcrypt from 'bcrypt';

import {
  CategoryKind,
  ContentStatus,
  CreationAvailability,
  Locale,
  MediaEntityType,
  PrismaClient,
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
    createdPageSections.set(section.sectionKey, section);
  }
  console.log(`✅ ${pageSections.length} sections de page d'accueil créées`);

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

    for (const { sectionKey, photo, photoAlt } of pageSections) {
      const section = createdPageSections.get(sectionKey);
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
    console.log("✅ Photos des sections d'accueil vérifiées/hébergées sur MinIO");

    for (const t of createdTestimonials) {
      const exists = await prisma.media.findFirst({
        where: { entityType: MediaEntityType.CUSTOMER_AVATAR, entityId: t.id },
      });
      if (!exists) {
        await attachPhoto(storage, 'avatars', t.photo, t.photoAlt, MediaEntityType.CUSTOMER_AVATAR, t.id);
      }
    }
    console.log('✅ Avatars des témoignages vérifiés/hébergés sur MinIO');
  } catch (error) {
    console.warn(
      '⚠️  Seed média ignoré (MinIO ou réseau indisponible) — les pages afficheront des dégradés de substitution.',
      error instanceof Error ? error.message : error,
    );
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
          : entityType === MediaEntityType.ATELIER
            ? 'atelierRefs'
            : entityType === MediaEntityType.PAGE_SECTION
              ? 'pageSectionRefs'
              : entityType === MediaEntityType.CUSTOMER_AVATAR
                ? 'testimonialRefs'
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

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
