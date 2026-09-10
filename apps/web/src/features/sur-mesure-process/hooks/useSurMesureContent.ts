export interface WhyChooseItem {
  icon: 'scissors' | 'gem' | 'heart';
  title: string;
  description: string;
}

export interface RealisationItem {
  imageUrl: string;
  title: string;
  label: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SurMesureContent {
  hero: { title: string; subtitle: string; imageUrl: string };
  whyChoose: { items: WhyChooseItem[] };
  gallery: { title: string; items: RealisationItem[] };
  testimonial: { quote: string; name: string; role: string; imageUrl: string };
  faq: { title: string; items: FaqItem[] };
  closing: { title: string };
}

/**
 * TODO(Phase 6): read from `GET /api/content/sections?page=sur-mesure` once
 * the `content` module exists — see docs/pages/sur-mesure-process.md "Points
 * d'attention". The 4 gallery pieces also default here rather than calling
 * `GET /api/creations?tag=sur-mesure` — that endpoint doesn't exist (the
 * `creations` module has no `tag` filter, only categoryId/collectionId/
 * isFeatured/sort, see apps/api/src/creations/application/dtos/
 * list-creations-query.dto.ts) — same gap noted in the page doc.
 *
 * Content below verified against the real Stitch screen "ANGALY — L'Art du
 * Sur Mesure" (projects/3703874896720765754/screens/
 * d7b5f0f55fad4e7492e21dde4b83fc89) via `agy`, not just stitch-prompts/
 * 11-sur-mesure-process.md's text (which has different, shorter pillar
 * copy, a testimonial reference number instead of a role, and different
 * gallery captions — the real screen wins per CLAUDE.md rule 9).
 */
const SUR_MESURE_CONTENT: SurMesureContent = {
  hero: {
    title: 'Sur Mesure',
    subtitle: 'Votre idée, façonnée avec précision, entièrement pour vous.',
    imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1600&q=80',
  },
  whyChoose: {
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
  gallery: {
    title: 'Quelques réalisations sur mesure',
    items: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1000&q=80',
        title: 'Robe de Soirée Velours',
        label: 'Création Exclusive',
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&q=80',
        title: 'Robe Éternelle',
        label: 'Broderie Artisanale',
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=80',
        title: 'Chemisier Soie et Dentelle',
        label: 'Ligne Couture',
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=80',
        title: 'Costume Tailleur Laine',
        label: 'Savoir-Faire Tailleur',
      },
    ],
  },
  testimonial: {
    quote:
      "L'expérience ANGALY est incomparable. De la première esquisse à l'essayage final, j'ai ressenti un dévouement absolu à la perfection. Ma robe sur mesure est bien plus qu'un vêtement, c'est une œuvre d'art qui me ressemble.",
    name: 'Éléonore de V.',
    role: 'Cliente Sur Mesure, Paris',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
  },
  faq: {
    title: 'Questions fréquentes',
    items: [
      {
        question: 'Quels sont les délais pour une création sur mesure ?',
        answer:
          'Le processus complet prend généralement entre 8 et 12 semaines, selon la complexité de la pièce et la disponibilité de nos artisans.',
      },
      {
        question: 'Comment se déroulent les tarifs ?',
        answer:
          'Chaque pièce étant unique, le tarif est établi sur devis après la première consultation. Un acompte de 50% est demandé pour lancer la confection.',
      },
      {
        question: "Combien d'essayages sont nécessaires ?",
        answer:
          'En moyenne, trois essayages sont nécessaires pour garantir un tomber parfait : la toile, le premier essayage tissu, et les finitions finales.',
      },
      {
        question: 'Où se déroulent les rendez-vous ?',
        answer:
          'Les consultations et essayages se déroulent dans notre atelier à Antananarivo ou lors de nos sessions privées internationales.',
      },
      {
        question: 'Puis-je commander à distance ?',
        answer:
          "Oui, nous accompagnons nos clients internationaux via des consultations vidéo et un guide de mesures assisté, bien que l'essayage final en présence soit recommandé.",
      },
    ],
  },
  closing: {
    title: 'Prêt·e à créer votre tenue sur mesure ?',
  },
};

export function useSurMesureContent(): { data: SurMesureContent; isLoading: false; error: null } {
  return { data: SUR_MESURE_CONTENT, isLoading: false, error: null };
}
