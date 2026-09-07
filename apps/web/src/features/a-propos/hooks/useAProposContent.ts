export interface ChronologyItem {
  year: string;
  title: string;
  description: string;
}

export interface SavoirFaireItem {
  title: string;
  description: string;
  imageUrl: string | null;
  icon: 'draw' | 'cut' | null;
}

export interface AtelierGalleryItem {
  imageUrl: string | null;
  icon: string | null;
  label: string | null;
  size: 'large' | 'default';
}

export interface AProposContent {
  hero: { title: string; subtitle: string; imageUrl: string | null };
  histoire: { title: string; paragraphs: string[]; imageUrl: string | null; chronology: ChronologyItem[] };
  fondatrice: { title: string; subtitle: string; paragraph: string; quote: string; imageUrl: string | null };
  savoirFaire: { title: string; subtitle: string; items: SavoirFaireItem[] };
  philosophie: { quote: string };
  atelier: { title: string; subtitle: string; items: AtelierGalleryItem[] };
  vision: { title: string; paragraph: string };
}

/**
 * TODO(Phase 6): read from `GET /api/content/sections?page=a-propos` once the
 * `content` module exists — see docs/pages/a-propos.md "Points d'attention".
 * Copy mirrors the real Stitch "Notre Histoire (À propos)" screen
 * (`028e4d74f15f4ad2b2a16424bacb5448`), not stitch-prompts/21-a-propos.md alone
 * — that text prompt implies an 8th "Valeurs" section (Excellence/Authenticité/
 * Exclusivité/Proximité client) the real screen simply doesn't have; omitted
 * rather than invented.
 */
const A_PROPOS_CONTENT: AProposContent = {
  hero: {
    title: 'Notre histoire',
    subtitle: 'Une maison de couture née à Madagascar, pensée pour durer.',
    imageUrl: null,
  },
  histoire: {
    title: 'Comment tout a commencé',
    paragraphs: [
      "Fondée au cœur d'Antananarivo, la maison ANGALY est née d'une passion pour l'élégance intemporelle et le savoir-faire méticuleux. Dès nos premiers pas, nous avons cherché à marier l'héritage riche de Madagascar avec les exigences de la haute couture internationale.",
      "Chaque création raconte une histoire, celle de mains expertes, de matières nobles sélectionnées avec rigueur, et d'une vision où le vêtement devient une œuvre d'art portée.",
    ],
    imageUrl: 'https://images.unsplash.com/photo-1643570155378-7ca46b1aa1f5?w=1200&q=80',
    chronology: [
      { year: '1998', title: 'La première esquisse', description: "L'ouverture de notre premier atelier confidentiel." },
      { year: '2010', title: "L'expansion", description: 'Reconnaissance nationale et premières collections sur-mesure.' },
    ],
  },
  fondatrice: {
    title: 'Qui est Angaly ?',
    subtitle: "L'âme de la maison",
    paragraph:
      "Visionnaire et artisane dans l'âme, Angaly a toujours cru que la véritable beauté réside dans les détails imperceptibles. Formée aux techniques traditionnelles et influencée par l'architecture moderne, elle insuffle à chaque collection une dualité unique : force et délicatesse, rigueur et fluidité.",
    quote: "Un vêtement n'est pas qu'une parure, c'est une architecture intime qui révèle la personne qui le porte.",
    imageUrl: null,
  },
  savoirFaire: {
    title: 'Notre Savoir-Faire',
    subtitle: 'L’excellence de la haute couture malgache, cultivée dans nos ateliers.',
    items: [
      {
        title: 'Couture main',
        description: 'Chaque point est une promesse de durabilité.',
        imageUrl: 'https://images.unsplash.com/photo-1676893140066-df87af3bc566?w=800&q=80',
        icon: null,
      },
      {
        title: 'Patronage sur mesure',
        description: "L'architecture parfaite pour épouser la silhouette.",
        imageUrl: 'https://images.unsplash.com/photo-1745091946873-92e0a0a7819c?w=800&q=80',
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
  philosophie: {
    quote:
      "Nous ne créons pas de la mode pour l'instant présent, nous forgeons des héritages de soie et de lin pour les générations futures.",
  },
  atelier: {
    title: "L'Atelier",
    subtitle: 'Dans les coulisses de la création',
    items: [
      { imageUrl: 'https://images.unsplash.com/photo-1641293498376-139cfe50ff67?w=1600&q=80', icon: null, label: null, size: 'large' },
      { imageUrl: 'https://images.unsplash.com/photo-1771098206650-81d713e2e2b9?w=1000&q=80', icon: null, label: null, size: 'default' },
      { imageUrl: null, icon: 'styler', label: 'Matières Nobles', size: 'default' },
      { imageUrl: 'https://images.unsplash.com/photo-1676893140066-df87af3bc566?w=1000&q=80', icon: null, label: null, size: 'default' },
    ],
  },
  vision: {
    title: "Incarnez l'élégance",
    paragraph: 'Découvrez des pièces uniques où chaque détail a été pensé pour sublimer votre allure.',
  },
};

export function useAProposContent(): { data: AProposContent; isLoading: false; error: null } {
  return { data: A_PROPOS_CONTENT, isLoading: false, error: null };
}
