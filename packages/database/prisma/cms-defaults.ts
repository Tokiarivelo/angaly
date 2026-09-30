/**
 * Default CMS content for the sections that used to be hardcoded in the web app (footer, menus, sur-mesure,
 * Pattern Studio landing, contact channels, home titles). Mirrors the built-in defaults of the matching web
 * hooks (the `use*Content` hooks under apps/web/src/features, plus components/layout/Footer.tsx) — so the admin editor opens on the
 * real current copy instead of an empty form.
 *
 * - FR rows are PUBLISHED (identical to what the site already shows).
 * - MG rows are DRAFTS: a first Malagasy translation of short labels/headings, to be reviewed by a native
 *   speaker and published from /gestion-contenu. Lists follow the FR structure (same order); only copy is
 *   translated — images, links and choices are inherited from the French rows.
 *
 * Inserted create-only (`seedCmsDefaults`): a row an editor already changed is never overwritten.
 */
import { ContentStatus, Locale } from '../generated/client';
import type { PrismaClient } from '../generated/client';

export interface CmsDefaultSection {
  page: string;
  sectionKey: string;
  locale: Locale;
  titleText?: string;
  subtitleText?: string;
  bodyText?: string;
  ctaPrimaryLabel?: string;
  ctaSecondaryLabel?: string;
  dataJson?: Record<string, unknown>;
  status: ContentStatus;
}

const fr = (page: string, sectionKey: string, rest: Omit<CmsDefaultSection, 'page' | 'sectionKey' | 'locale' | 'status'> = {}): CmsDefaultSection => ({
  page,
  sectionKey,
  locale: Locale.FR,
  status: ContentStatus.PUBLISHED,
  ...rest,
});
const mg = (page: string, sectionKey: string, rest: Omit<CmsDefaultSection, 'page' | 'sectionKey' | 'locale' | 'status'> = {}): CmsDefaultSection => ({
  page,
  sectionKey,
  locale: Locale.MG,
  status: ContentStatus.DRAFT,
  ...rest,
});

const HEADER_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'La Une', href: '/la-une' },
  { label: 'Nos Créations', href: '/creations' },
  { label: 'Prêt-à-porter', href: '/pret-a-porter' },
  { label: 'Atelier', href: '/ateliers' },
  { label: 'Héritage', href: '/a-propos' },
  { label: 'Journal', href: '/journal' },
  { label: 'Pattern Studio', href: '/pattern-studio' },
];

const DRAWER_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'La Une', href: '/la-une' },
  { label: 'Nos Créations', href: '/creations' },
  { label: 'Prêt-à-porter', href: '/pret-a-porter' },
  { label: 'Sur Mesure', href: '/sur-mesure' },
  { label: 'Patron Premium', href: '/pattern-studio', badge: 'Premium' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Ateliers', href: '/ateliers' },
  { label: 'Journal', href: '/journal' },
  { label: 'Contact', href: '/contact' },
];

const PROCESS_STEPS = ['Votre idée', 'Consultation', 'Mesures', 'Conception', 'Patron', 'Confection', 'Essayage', 'Livraison'];

const HOW_IT_WORKS: [string, string, string][] = [
  ['Nouveau projet', 'Initialisation de votre atelier numérique personnalisé', 'conception'],
  ['Type de vêtement', 'Sélection de la pièce (robe, jupe, costume, chemise…)', 'conception'],
  ['Style & silhouette', 'Définition de l’esprit couture (classique, moderne, glamour…)', 'conception'],
  ['Personnalisation', 'Choix de la coupe, du col, des manches et des finitions', 'conception'],
  ['Photo d’inspiration', 'Analyse indicative des lignes par notre assistant numérique', 'conception'],
  ['Mesures exactes', 'Association de votre profil de mesures morphologiques', 'conception'],
  ['Génération géométrique', 'Calcul déterministe précis des pièces par le moteur Angaly', 'generation'],
  ['Prévisualisation technique', 'Inspection des pièces (droit-fil, crans, marges de couture)', 'generation'],
  ['Vérification Angaly', 'Examen attentif et validation par une couturière experte', 'validation'],
  ['Validation finale', 'Approbation professionnelle pour coupe en tissu noble', 'validation'],
  ['Export professionnel', 'Téléchargement aux formats PDF A4/A3/A0, SVG et DXF', 'validation'],
];

export const CMS_DEFAULT_SECTIONS: CmsDefaultSection[] = [
  // --- Pied de page -------------------------------------------------------------------------------------------
  fr('footer', 'brand', {
    titleText: 'ANGALY',
    bodyText:
      "Maison de couture basée à Madagascar, dédiée à l'élégance intemporelle et au savoir-faire artisanal d'exception.",
  }),
  fr('footer', 'informations', {
    titleText: 'Informations',
    dataJson: {
      links: [
        { label: 'Mentions Légales', href: '/mentions-legales' },
        { label: 'Confidentialité', href: '/confidentialite' },
        { label: 'Livraison & Retours', href: '/livraison-retours' },
      ],
    },
  }),
  fr('footer', 'maison', {
    titleText: 'La Maison',
    dataJson: {
      links: [
        { label: 'Presse', href: '/presse' },
        { label: 'Carrières', href: '/carrieres' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  }),
  fr('footer', 'legal', { titleText: '© {year} Angaly Madagascar. Tous droits réservés.' }),
  mg('footer', 'brand', {
    bodyText: 'Trano fanaovana akanjo any Madagasikara, natokana ho an’ny hatsaran-tarehy tsy miova sy ny fahaizana nentim-paharazana.',
  }),
  mg('footer', 'informations', {
    titleText: 'Fampahalalana',
    dataJson: { links: [{ label: 'Fanamarihana ara-dalàna' }, { label: 'Fiainana manokana' }, { label: 'Fandefasana & Fiverenana' }] },
  }),
  mg('footer', 'maison', {
    titleText: 'Ny Trano',
    dataJson: { links: [{ label: 'Gazety' }, { label: 'Asa' }, { label: 'Fifandraisana' }] },
  }),
  mg('footer', 'legal', { titleText: '© {year} Angaly Madagasikara. Zon’ny mpamorona rehetra voatokana.' }),

  // --- Menus ---------------------------------------------------------------------------------------------------
  fr('navigation', 'header', { dataJson: { links: HEADER_LINKS } }),
  fr('navigation', 'drawer', { dataJson: { links: DRAWER_LINKS } }),
  fr('navigation', 'drawer-secondary', {
    dataJson: {
      links: [
        { label: 'Mes favoris', href: '/mes-favoris' },
        { label: 'Mon compte', href: '/espace-client' },
      ],
    },
  }),
  mg('navigation', 'header', {
    dataJson: {
      links: [
        { label: 'Fandraisana' },
        { label: 'Ny Vaovao' },
        { label: 'Ny Famoronanay' },
        { label: 'Akanjo vita' },
        { label: 'Toeram-piasana' },
        { label: 'Lova' },
        { label: 'Gazety' },
        { label: 'Pattern Studio' },
      ],
    },
  }),
  mg('navigation', 'drawer', {
    dataJson: {
      links: [
        { label: 'Fandraisana' },
        { label: 'Ny Vaovao' },
        { label: 'Ny Famoronanay' },
        { label: 'Akanjo vita' },
        { label: 'Voatondro manokana' },
        { label: 'Patron Premium' },
        { label: 'Momba anay' },
        { label: 'Toeram-piasana' },
        { label: 'Gazety' },
        { label: 'Fifandraisana' },
      ],
    },
  }),
  mg('navigation', 'drawer-secondary', { dataJson: { links: [{ label: 'Ireo tiako' }, { label: 'Ny kaontiko' }] } }),

  // --- Accueil : titres restants -------------------------------------------------------------------------------
  fr('accueil', 'la-une', { titleText: 'La Une', ctaPrimaryLabel: 'Voir toutes les collections' }),
  fr('accueil', 'ateliers', { titleText: 'Nos Ateliers' }),
  fr('accueil', 'journal', { titleText: 'Le Journal Angaly' }),
  fr('accueil', 'newsletter', { titleText: 'Restez informée des nouvelles collections' }),
  mg('accueil', 'la-une', { titleText: 'Ny Vaovao', ctaPrimaryLabel: 'Jereo ny fanangonana rehetra' }),
  mg('accueil', 'ateliers', { titleText: 'Ny Toeram-piasanay' }),
  mg('accueil', 'journal', { titleText: 'Ny Gazetin’ny Angaly' }),
  mg('accueil', 'newsletter', { titleText: 'Aza tapa-kevitra amin’ny fanangonana vaovao' }),

  // --- Contact -------------------------------------------------------------------------------------------------
  fr('contact', 'coordonnees', {
    titleText: 'Nous joindre',
    dataJson: {
      phoneLabel: '+261 20 22 123 45',
      phoneHref: 'tel:+261202212345',
      whatsappHref: 'https://wa.me/261202212345',
      emailLabel: 'contact@angaly.mg',
      emailHref: 'mailto:contact@angaly.mg',
    },
  }),
  fr('contact', 'reseaux', {
    titleText: 'Réseaux',
    dataJson: {
      links: [
        { label: 'Facebook', href: '#' },
        { label: 'Instagram', href: '#' },
      ],
    },
  }),
  fr('contact', 'horaires', {
    titleText: 'Nos horaires',
    dataJson: {
      rows: [
        { label: 'Lun - Ven', value: '09:00 - 18:00', closed: 'non' },
        { label: 'Samedi', value: '10:00 - 17:00', closed: 'non' },
        { label: 'Dimanche', value: 'Fermé', closed: 'oui' },
      ],
    },
  }),
  mg('contact', 'coordonnees', { titleText: 'Antsoy izahay' }),
  mg('contact', 'reseaux', { titleText: 'Tambajotra sosialy' }),
  mg('contact', 'horaires', {
    titleText: 'Ora fiasana',
    dataJson: {
      rows: [
        { label: 'Alatsinainy - Zoma', value: '09:00 - 18:00' },
        { label: 'Asabotsy', value: '10:00 - 17:00' },
        { label: 'Alahady', value: 'Mihidy' },
      ],
    },
  }),

  // --- Sur mesure ----------------------------------------------------------------------------------------------
  fr('sur-mesure', 'hero', { titleText: 'Sur Mesure', subtitleText: 'Votre idée, façonnée avec précision, entièrement pour vous.' }),
  fr('sur-mesure', 'etapes', {
    titleText: 'Le parcours sur mesure',
    dataJson: { steps: PROCESS_STEPS.map((title) => ({ title })) },
  }),
  fr('sur-mesure', 'pourquoi', {
    dataJson: {
      items: [
        {
          icon: 'scissors',
          title: 'Précision',
          description:
            "Chaque point est exécuté avec une maîtrise artisanale inégalée, garantissant une coupe qui épouse parfaitement votre silhouette et reflète l'excellence de notre maison.",
        },
        {
          icon: 'gem',
          title: 'Exclusivité',
          description:
            "Une création véritablement unique. Votre pièce est imaginée et conçue exclusivement pour vous, incarnant l'essence même du luxe et de l'individualité.",
        },
        {
          icon: 'heart',
          title: 'Accompagnement',
          description:
            'Un service de conciergerie personnel tout au long de votre parcours. Nos experts vous guident pas à pas, de l’inspiration initiale à l’essayage final.',
        },
      ],
    },
  }),
  fr('sur-mesure', 'realisations', {
    titleText: 'Quelques réalisations sur mesure',
    dataJson: {
      items: [
        { title: 'Robe de Soirée Velours', label: 'Création Exclusive', imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1000&q=80' },
        { title: 'Robe Éternelle', label: 'Broderie Artisanale', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&q=80' },
        { title: 'Chemisier Soie et Dentelle', label: 'Ligne Couture', imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=80' },
        { title: 'Costume Tailleur Laine', label: 'Savoir-Faire Tailleur', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=80' },
      ],
    },
  }),
  fr('sur-mesure', 'temoignage', {
    bodyText:
      "L'expérience ANGALY est incomparable. De la première esquisse à l'essayage final, j'ai ressenti un dévouement absolu à la perfection. Ma robe sur mesure est bien plus qu'un vêtement, c'est une œuvre d'art qui me ressemble.",
    dataJson: { name: 'Éléonore de V.', role: 'Cliente Sur Mesure, Paris' },
  }),
  fr('sur-mesure', 'faq', {
    titleText: 'Questions fréquentes',
    dataJson: {
      items: [
        {
          question: 'Quels sont les délais pour une création sur mesure ?',
          answer: 'Le processus complet prend généralement entre 8 et 12 semaines, selon la complexité de la pièce et la disponibilité de nos artisans.',
        },
        {
          question: 'Comment se déroulent les tarifs ?',
          answer: 'Chaque pièce étant unique, le tarif est établi sur devis après la première consultation. Un acompte de 50% est demandé pour lancer la confection.',
        },
        {
          question: "Combien d'essayages sont nécessaires ?",
          answer: 'En moyenne, trois essayages sont nécessaires pour garantir un tomber parfait : la toile, le premier essayage tissu, et les finitions finales.',
        },
        {
          question: 'Où se déroulent les rendez-vous ?',
          answer: 'Les consultations et essayages se déroulent dans notre atelier à Antananarivo ou lors de nos sessions privées internationales.',
        },
        {
          question: 'Puis-je commander à distance ?',
          answer: "Oui, nous accompagnons nos clients internationaux via des consultations vidéo et un guide de mesures assisté, bien que l'essayage final en présence soit recommandé.",
        },
      ],
    },
  }),
  fr('sur-mesure', 'closing', { titleText: 'Prêt·e à créer votre tenue sur mesure ?' }),
  mg('sur-mesure', 'hero', { titleText: 'Voatondro manokana', subtitleText: 'Ny hevitrao, namboarina tsara, ho anao manokana.' }),
  mg('sur-mesure', 'etapes', {
    titleText: 'Ny dingana ho an’ny akanjo voatondro manokana',
    dataJson: {
      steps: [
        { title: 'Ny hevitrao' },
        { title: 'Fifanarahana' },
        { title: 'Refy' },
        { title: 'Famolavolana' },
        { title: 'Modely' },
        { title: 'Fanaovana' },
        { title: 'Fanandramana' },
        { title: 'Fanaterana' },
      ],
    },
  }),
  mg('sur-mesure', 'realisations', { titleText: 'Asa vitsivitsy voatondro manokana' }),
  mg('sur-mesure', 'faq', { titleText: 'Fanontaniana mahazatra' }),
  mg('sur-mesure', 'closing', { titleText: 'Vonona hamorona ny akanjonao voatondro manokana ve ianao?' }),

  // --- Pattern Studio (présentation) ---------------------------------------------------------------------------
  fr('pattern-studio', 'hero', {
    titleText: 'Angaly Pattern Studio',
    subtitleText: 'Votre patron, créé selon vos mesures.',
    bodyText:
      'Un moteur de patronage paramétrique assisté par intelligence artificielle, pensé comme un véritable atelier numérique — pas une simple IA qui dessine à votre place.',
    ctaPrimaryLabel: 'Nouveau projet',
    ctaSecondaryLabel: 'Découvrir le fonctionnement',
    dataJson: { badge: 'PREMIUM' },
  }),
  fr('pattern-studio', 'fonctionnement', {
    titleText: 'Comment ça fonctionne',
    subtitleText: 'Du premier croquis numérique à l’export d’atelier millimétré',
    dataJson: { steps: HOW_IT_WORKS.map(([label, description, category]) => ({ label, description, category })) },
  }),
  fr('pattern-studio', 'confiance', {
    bodyText:
      '« L’intelligence artificielle comme assistante du patronage professionnel — jamais comme un remplacement de la couturière. »',
    dataJson: {
      points: [
        { icon: 'Sparkles', title: 'Précision paramétrique', description: 'Moteur géométrique déterministe garantissant des lignes d’assemblage parfaites et sans distorsion.' },
        { icon: 'ShieldCheck', title: 'Vérification humaine', description: 'Contrôle attentif de la silhouette et des aisances par une couturière d’expérience Angaly avant validation.' },
        { icon: 'Download', title: 'Export professionnel', description: 'Fichiers multi-formats prêts pour l’atelier : PDF (A4/A3/A0 avec marges), SVG vectoriel et DXF standard.' },
      ],
    },
  }),
  fr('pattern-studio', 'apercu', {
    titleText: 'Précision artisanale & numérique',
    subtitleText: 'Chaque pièce technique intègre droit-fil, marges de couture et crans de montage.',
  }),
  fr('pattern-studio', 'offres', {
    titleText: 'Nos offres d’atelier',
    subtitleText: 'Choisissez le niveau d’accompagnement adapté à votre projet couture.',
    dataJson: {
      tiers: [
        {
          id: 'digital-pattern',
          name: 'Patron numérique',
          price: '45 000 Ar',
          description: 'Pour les passionné·e·s et couturiers autonomes souhaitant un patron millimétré prêt à l’impression.',
          features: [
            'Génération paramétrique déterministe',
            'Prévisualisation SVG interactive',
            'Export PDF (planches A4, A3, traceur A0)',
            'Guide de placement & marges de couture incluses',
          ].join('\n'),
          recommended: 'non',
          ctaText: 'Choisir cette offre',
        },
        {
          id: 'verified-pattern',
          name: 'Patron + Vérification Angaly',
          price: '95 000 Ar',
          description: 'La garantie haute couture : votre patron inspecté et ajusté par une couturière d’atelier expérimentée.',
          features: [
            'Toutes les fonctionnalités du Patron numérique',
            'Contrôle expert par une couturière Angaly',
            'Ajustements de proportion morphologique sur-mesure',
            'Conseils personnalisés sur le choix des étoffes',
            'Support direct en atelier en cas de question',
          ].join('\n'),
          recommended: 'oui',
          ctaText: 'Choisir cette offre',
        },
        {
          id: 'bespoke-tailoring',
          name: 'Patron + Confection Atelier',
          price: 'Sur devis atelier',
          description: 'De l’esquisse numérique à l’œuvre portée : confection intégrale par nos artisanes à Madagascar.',
          features: [
            'Patron numérique & vérification complète',
            'Approvisionnement en matières d’exception (soie, dentelle, lin)',
            'Confection artisanale dans nos ateliers d’Antananarivo',
            'Séance d’essayage en atelier ou envoi sécurisé',
          ].join('\n'),
          recommended: 'non',
          ctaText: 'Choisir cette offre',
        },
      ],
    },
  }),
  fr('pattern-studio', 'closing', {
    titleText: 'Prêt·e à créer votre patron ?',
    subtitleText: 'Donnez vie à votre vêtement couture sur-mesure dès aujourd’hui.',
    ctaPrimaryLabel: 'Nouveau projet',
  }),
  mg('pattern-studio', 'hero', {
    titleText: 'Angaly Pattern Studio',
    subtitleText: 'Ny modelinao, namboarina araka ny refinao.',
    ctaPrimaryLabel: 'Tetikasa vaovao',
    ctaSecondaryLabel: 'Fantaro ny fiasany',
    dataJson: { badge: 'PREMIUM' },
  }),
  mg('pattern-studio', 'fonctionnement', { titleText: 'Ny fiasany' }),
  mg('pattern-studio', 'offres', { titleText: 'Ny tolotray ho an’ny toeram-piasana' }),
  mg('pattern-studio', 'closing', {
    titleText: 'Vonona hamorona ny modelinao ve ianao?',
    ctaPrimaryLabel: 'Tetikasa vaovao',
  }),
];

/** Create-only insert of every default section (a row that already exists — possibly edited — is left untouched). */
export async function seedCmsDefaults(prisma: PrismaClient, updatedById: string | null = null): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  for (const section of CMS_DEFAULT_SECTIONS) {
    const where = { page_sectionKey_locale: { page: section.page, sectionKey: section.sectionKey, locale: section.locale } };
    if (await prisma.pageSection.findUnique({ where })) {
      skipped += 1;
      continue;
    }
    await prisma.pageSection.create({
      data: {
        page: section.page,
        sectionKey: section.sectionKey,
        locale: section.locale,
        titleText: section.titleText ?? null,
        subtitleText: section.subtitleText ?? null,
        bodyText: section.bodyText ?? null,
        ctaPrimaryLabel: section.ctaPrimaryLabel ?? null,
        ctaSecondaryLabel: section.ctaSecondaryLabel ?? null,
        ...(section.dataJson ? { dataJson: section.dataJson as never } : {}),
        status: section.status,
        updatedById,
      },
    });
    created += 1;
  }
  return { created, skipped };
}
