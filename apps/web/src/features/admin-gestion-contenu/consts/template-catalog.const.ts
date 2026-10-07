import type { CmsTemplatePreset } from '../types/template.types';

export const CMS_TEMPLATE_PRESETS: readonly CmsTemplatePreset[] = [
  {
    id: 'hero-nouvelle-collection',
    name: 'Bandeau Cinématographique',
    category: 'hero',
    kind: 'hero-cinematic',
    description: 'Immersion plein cadre avec typographie Cormorant Garamond majestueuse, voile sombre et boutons couture.',
    defaultValues: {
      titleText: 'ÉCLIPSE SOLAIRE',
      subtitleText: 'Collection Haute Couture 2026',
      bodyText: 'Une ode aux lignes épurées et à la noblesse de la soie sauvage malgache.',
      ctaPrimaryLabel: 'Prendre rendez-vous',
      ctaPrimaryHref: '/rendez-vous',
      ctaSecondaryLabel: 'Découvrir la collection',
      ctaSecondaryHref: '/creations',
    },
    defaultImageUrl: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=1600&q=80&fm=jpg',
    defaultImageAlt: 'Robe de mariée haute couture Angaly',
    defaultDataJson: {
      templateKind: 'hero-cinematic',
      eyebrow: 'MAISON DE COUTURE — MADAGASCAR',
      overlayOpacity: 60,
    },
  },
  {
    id: 'editorial-savoir-faire',
    name: 'Éditorial Double Colonne',
    category: 'editorial',
    kind: 'editorial-split',
    description: 'Composition asymétrique : portrait 3/4 encadré d’or et d’ivoire, typographie éditoriale et appel à l’action.',
    defaultValues: {
      titleText: 'L’Art de la Coupe Précise',
      subtitleText: 'NOTRE SAVOIR-FAIRE',
      bodyText:
        'Chaque pièce naît d’une écoute attentive et prend forme sous les gestes méticuleux de nos couturières. De la première esquisse au point d’arrêt final, nous célébrons l’élégance intemporelle façonnée sur mesure.',
      ctaPrimaryLabel: 'Découvrir la Maison',
      ctaPrimaryHref: '/a-propos',
    },
    defaultImageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80&fm=jpg',
    defaultImageAlt: 'Couturières dans notre atelier',
    defaultDataJson: {
      templateKind: 'editorial-split',
      eyebrow: 'NOTRE SAVOIR-FAIRE',
      imagePosition: 'left',
    },
  },
  {
    id: 'vitrine-univers',
    name: 'Grille d’Univers & Collections',
    category: 'vitrine',
    kind: 'cards-grid',
    description: 'Grille de cartes photographiques haute couture avec effet zoom délicat et typographie en capitales.',
    defaultValues: {
      titleText: 'Nos Univers d’Exception',
      subtitleText: 'COLLECTIONS SIGNATURE',
      bodyText: 'Explorez nos pièces d’exception pensées pour sublimer chaque instant.',
      ctaPrimaryLabel: 'Voir toutes les créations',
      ctaPrimaryHref: '/creations',
    },
    defaultDataJson: {
      templateKind: 'cards-grid',
      columns: 4,
      items: [
        {
          label: 'Robes de Mariée',
          title: 'Mariage Couture',
          imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&fm=jpg',
          imageAlt: 'Robe de mariée d’exception',
          href: '/creations',
        },
        {
          label: 'Costumes Sur Mesure',
          title: 'Homme & Tailleur',
          imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80&fm=jpg',
          imageAlt: 'Costume sur mesure élégant',
          href: '/creations',
        },
        {
          label: 'Robes de Soirée',
          title: 'Soirées & Galas',
          imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80&fm=jpg',
          imageAlt: 'Robe de soirée scintillante',
          href: '/creations',
        },
        {
          label: 'Confection Privilège',
          title: 'Sur Mesure',
          imageUrl: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800&q=80&fm=jpg',
          imageAlt: 'Atelier de confection sur mesure',
          href: '/sur-mesure',
        },
      ],
    },
  },
  {
    id: 'process-sur-mesure',
    name: 'Parcours de Confection (Étapes)',
    category: 'process',
    kind: 'steps-process',
    description: 'Chronologie luxueuse d’étapes numérotées reliées par des filets or sur fond bleu marine profond.',
    defaultValues: {
      titleText: 'L’Expérience Sur Mesure',
      subtitleText: '7 ÉTAPES VERS LA PERFECTION',
      ctaPrimaryLabel: 'Démarrer ma création',
      ctaPrimaryHref: '/sur-mesure',
    },
    defaultDataJson: {
      templateKind: 'steps-process',
      steps: [
        { label: 'Rencontre', description: 'Consultation & esquisse' },
        { label: 'Matières', description: 'Sélection des soies nobles' },
        { label: 'Mesures', description: 'Prise de mesures précises' },
        { label: 'Toile', description: 'Premier essayage d’ajustement' },
        { label: 'Ajustements', description: 'Finitions à la main' },
        { label: 'Livraison', description: 'Votre pièce d’exception' },
      ],
    },
  },
  {
    id: 'cta-banner-prestige',
    name: 'Bannière d’Appel à l’Action (CTA)',
    category: 'engagement',
    kind: 'cta-banner',
    description: 'Bandeau contrasté et affirmé pour inciter à la prise de rendez-vous ou à la visite en atelier.',
    defaultValues: {
      titleText: 'Donnez Vie à Votre Projet d’Exception',
      subtitleText: 'CONSULTATION PRIVÉE EN ATELIER',
      bodyText:
        'Nos maîtres tailleurs et modélistes vous accueillent sur rendez-vous pour concevoir une création unique, parfaitement adaptée à votre silhouette.',
      ctaPrimaryLabel: 'Prendre un rendez-vous',
      ctaPrimaryHref: '/rendez-vous',
      ctaSecondaryLabel: 'Nous contacter',
      ctaSecondaryHref: '/contact',
    },
    defaultDataJson: {
      templateKind: 'cta-banner',
      theme: 'navy',
    },
  },
  {
    id: 'quote-fondatrice',
    name: 'Citation Éditoriale & Témoignage',
    category: 'editorial',
    kind: 'quote-editorial',
    description: 'Mise en avant d’une vision, d’un manifeste de la maison ou d’un témoignage client privilégié.',
    defaultValues: {
      titleText: 'La Beauté du Geste Artisanal',
      bodyText:
        '« La haute couture n’est pas seulement une question de coupe ou de tissu ; c’est la rencontre intime entre l’âme d’une cliente et le dévouement d’un artisan. »',
      ctaPrimaryLabel: 'Lire le manifeste',
      ctaPrimaryHref: '/a-propos',
    },
    defaultImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80&fm=jpg',
    defaultImageAlt: 'Portrait de la fondatrice',
    defaultDataJson: {
      templateKind: 'quote-editorial',
      authorName: 'Miora R.',
      authorRole: 'Directrice de création & Fondatrice',
      quote:
        '« La haute couture n’est pas seulement une question de coupe ou de tissu ; c’est la rencontre intime entre l’âme d’une cliente et le dévouement d’un artisan. »',
    },
  },
  {
    id: 'mosaic-ateliers',
    name: 'Mosaïque d’Artisanat (Galerie)',
    category: 'vitrine',
    kind: 'gallery-mosaic',
    description: 'Composition asymétrique de photos d’atelier mettant en valeur le travail de la main et les détails textiles.',
    defaultValues: {
      titleText: 'L’Atelier en Images',
      subtitleText: 'COULISSES DE LA MAISON',
      bodyText: 'Découvrez la minutie du travail fait main dans nos ateliers d’Antananarivo.',
    },
    defaultDataJson: {
      templateKind: 'gallery-mosaic',
      items: [
        {
          title: 'Broderie main',
          description: 'Fil d’or et perles',
          imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80&fm=jpg',
          imageAlt: 'Détail de broderie manuelle',
        },
        {
          title: 'Patronage millimétré',
          description: 'Tracé sur toile',
          imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80&fm=jpg',
          imageAlt: 'Patronage sur toile',
        },
        {
          title: 'Étoffes nobles',
          description: 'Soies sauvages et dentelles',
          imageUrl: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800&q=80&fm=jpg',
          imageAlt: 'Étoffes de haute qualité',
        },
      ],
    },
  },
  {
    id: 'newsletter-cercle',
    name: 'Inscription Cercle Privé (Newsletter)',
    category: 'engagement',
    kind: 'newsletter-block',
    description: 'Invitation épurée à rejoindre le cercle privé Angaly pour recevoir les avant-premières.',
    defaultValues: {
      titleText: 'Rejoindre le Cercle Privé Angaly',
      subtitleText: 'AVANT-PREMIÈRES & INVITATIONS EXCLUSIVES',
      bodyText: 'Recevez en avant-première les lancements de nos capsules et les invitations à nos défilés privés.',
      ctaPrimaryLabel: 'S’inscrire au Cercle',
    },
    defaultDataJson: {
      templateKind: 'newsletter-block',
      placeholder: 'Votre adresse email privilégiée',
    },
  },
  {
    id: 'faq-confection',
    name: 'Questions Fréquentes (Accordéons)',
    category: 'engagement',
    kind: 'faq-accordion',
    description: 'Série de questions-réponses pour rassurer vos clientes sur les délais, essayages et livraisons.',
    defaultValues: {
      titleText: 'Questions Fréquentes',
      subtitleText: 'TOUT CE QU’IL FAUT SAVOIR',
      bodyText: 'Retrouvez les réponses aux questions les plus courantes sur notre service sur mesure.',
    },
    defaultDataJson: {
      templateKind: 'faq-accordion',
      items: [
        {
          title: 'Combien de temps à l’avance réserver un rendez-vous ?',
          description: 'Nous recommandons de prendre contact 2 à 3 mois à l’avance pour une création sur mesure.',
        },
        {
          title: 'Combien d’essayages sont nécessaires ?',
          description: 'En moyenne 3 à 4 essayages sont prévus pour garantir un tombé impeccable.',
        },
        {
          title: 'Proposez-vous des rendez-vous à distance ?',
          description: 'Oui, grâce à Angaly Pattern Studio, nous réalisons des consultations vidéo accompagnées de prise de mesures guidée.',
        },
      ],
    },
  },
];
