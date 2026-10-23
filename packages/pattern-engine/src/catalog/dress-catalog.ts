import type { MeasurementSet, PatternParameters } from '../types';

/**
 * Dress catalogue — the dresses the engine knows how to make, spanning modern, historical and rare ones, each with the
 * pieces a complete pattern must have (research and sources: docs/reviews/dress-pattern-catalog.md). Served to customers
 * by the API (`pattern-catalog` module: « Catalogue des patrons »), checked by `dress-catalog.test.ts` (inventory +
 * geometry) and drawn by `catalog-plates.tool.test.ts` (the reference plates, `PLATES_DIR=… npx vitest run …`).
 *
 * `expect` lists regular expressions (case-insensitive) that must each match at least one generated piece name;
 * `absent` the ones that must match none. Only the established vocabulary is used, so the cases stay valid while
 * other options evolve.
 */
export interface DressCase {
  id: string;
  title: string;
  /** Period or family, for the plates and the review. */
  era: string;
  /**
   * How the dress looks (colours and cloth, read off its inspiration photo): what the 3D preview needs besides the
   * geometry. Same fields as `GarmentFit` (@angaly/types).
   */
  look?: {
    fabricBehavior?: 'FLUIDE' | 'STRUCTURE' | 'RIGIDE' | 'STRETCH';
    fabricPrint?: 'UNI' | 'POIS' | 'RAYURES' | 'CARREAUX' | 'FLEURI' | 'BROCART' | 'ARABESQUE' | 'AUTRE';
    fabricFinish?: 'MAT' | 'VELOURS' | 'SATIN';
    fabricColor?: string;
    motifColor?: string;
    contrastColor?: string;
  };
  /** Shelf of the catalogue page. */
  group?: 'MODERNE' | 'HISTORIQUE' | 'MARIEE';
  /** What the case exercises (pattern types, rare pieces). */
  notes: string;
  parameters: PatternParameters;
  expect: string[];
  absent?: string[];
}

/** Reference body (cm): poitrine 92, taille 74, bassin 98, dos 42 — the vocabulary's reference values. */
export const CATALOG_MEASUREMENTS: MeasurementSet = {
  TOUR_COU: 36,
  TOUR_POITRINE: 92,
  TOUR_TAILLE: 74,
  TOUR_BASSIN: 98,
  LONGUEUR_DOS: 42,
  LONGUEUR_BRAS: 59,
  CARRURE_DOS: 36,
  TOUR_POIGNET: 16,
};

const robe = (cutType: string, details: Record<string, string>, extra: Partial<PatternParameters> = {}): PatternParameters => ({
  garmentType: 'ROBE',
  cutType,
  style: null,
  details,
  ...extra,
});
const mariee = (cutType: string, details: Record<string, string>, extra: Partial<PatternParameters> = {}): PatternParameters => ({
  ...robe(cutType, details, extra),
  garmentType: 'ROBE_MARIEE',
});

export const DRESS_CATALOG: DressCase[] = [
  // ------------------------------------------------------------ modern classics
  {
    id: 'fourreau-double',
    // Photo: white 1960s sheath (Smithsonian NMAAHC, CC0).
    look: { fabricBehavior: 'STRUCTURE', fabricColor: '#eeebe2' },
    title: 'Fourreau doublé (sheath)',
    era: 'Années 60 / moderne',
    notes: 'Robe ajustée sans manches, entièrement doublée, finitions au biais : doublure de chaque pièce, entoilage.',
    parameters: robe('AJUSTEE', { manches: 'SANS_MANCHES', col: 'BATEAU', longueur: 'GENOU', fermeture: 'ZIP_INVISIBLE' }, {
      construction: { items: [{ kind: 'LINING' }, { kind: 'BIAS_BINDING', widthMm: 30 }] },
    }),
    expect: ['^Corsage Devant', '^Corsage Dos', '^Jupe Devant', '^Jupe Dos', '^Doublure — Corsage Devant', '^Doublure — Jupe Dos', '^Biais d’encolure', '^Biais d’emmanchure'],
    absent: ['^Manche', '^Doublure — Manche'],
  },
  {
    id: 'robe-chemise',
    look: { fabricBehavior: 'STRUCTURE', fabricPrint: 'CARREAUX', fabricColor: '#3b4a7a', motifColor: '#b03040', contrastColor: '#f4f1ea' },
    title: 'Robe chemise ceinturée, poches',
    era: 'Moderne (1950 → aujourd’hui)',
    notes: 'Col chemise et pied de col, boutonnage, ceinture nouée, poches dans les coutures, entoilage du col et des poignets.',
    parameters: robe('DROITE', { manches: 'LONGUES', col: 'CHEMISIER', longueur: 'MIDI', fermeture: 'CEINTURE_NOUEE' }, {
      construction: { items: [{ kind: 'SEAM_POCKETS' }, { kind: 'INTERFACING' }, { kind: 'CONTRAST_CUFFS', heightMm: 60, color: '#ffffff' }] },
    }),
    expect: ['^Col chemise', '^Ceinture', '^Nœud', '^Fond de poche dans la couture', '^Entoilage — Col chemise', '^Manche', '^Poignet \\(contraste'],
  },
  {
    id: 'portefeuille',
    // Photo: red wrap dress with short puff sleeves (Commons, Junta de Andalucía, CC BY-SA 2.0), cropped to the dress.
    look: { fabricBehavior: 'FLUIDE', fabricColor: '#b8202f' },
    title: 'Robe portefeuille (wrap dress)',
    era: 'Moderne (1974)',
    notes: 'Devant croisé (bloc WRAP_FRONT), manches courtes, ceinture nouée.',
    parameters: robe('EVASEE', { manches: 'COURTES', col: 'EN_V', longueur: 'GENOU', fermeture: 'CEINTURE_NOUEE' }, {
      drape: { blocks: [{ kind: 'WRAP_FRONT', overlapMm: 120, side: 'LEFT' }] },
    }),
    expect: ['croisé', '^Ceinture', '^Manche'],
  },
  {
    id: 'trapeze-60',
    look: { fabricBehavior: 'STRUCTURE', fabricPrint: 'FLEURI', fabricColor: '#d8c8a8', motifColor: '#2f4f6f' },
    title: 'Robe trapèze années 60',
    era: '1960',
    notes: 'Ligne A courte sans manches, doublée, biais d’encolure et d’emmanchures.',
    parameters: robe('EVASEE', { manches: 'SANS_MANCHES', col: 'ROND', longueur: 'MINI' }, {
      construction: { items: [{ kind: 'LINING', parts: ['CORSAGE', 'JUPE'] }, { kind: 'BIAS_BINDING', widthMm: 25 }] },
    }),
    expect: ['^Doublure — Jupe', '^Biais d’emmanchure'],
  },
  {
    id: 'boheme-etagee',
    look: { fabricBehavior: 'FLUIDE', fabricPrint: 'FLEURI', fabricColor: '#5a3a2e', motifColor: '#e3cfb8' },
    title: 'Maxi bohème à volants étagés',
    era: 'Années 70',
    notes: 'Taille empire, manches cloche, trois volants étagés froncés le long de la jupe.',
    parameters: robe('EVASEE', { manches: 'CLOCHE', col: 'EN_V', longueur: 'MAXI', taille: 'HAUTE' }, {
      construction: { items: [{ kind: 'HEM_FLOUNCE', tiers: 3, depthMm: 220, style: 'FRONCE' }] },
    }),
    expect: ['^Volant étagé 1/3', '^Volant étagé 2/3', '^Volant étagé 3/3'],
  },
  {
    id: 'godets-30',
    look: { fabricBehavior: 'FLUIDE', fabricFinish: 'SATIN', fabricColor: '#1a1a1a' },
    title: 'Robe à godets années 30',
    era: '1930',
    notes: 'Fourreau mi-mollet qui s’ouvre en godets insérés dans les coutures depuis le genou ; mancherons.',
    parameters: robe('AJUSTEE', { manches: 'CAP', col: 'EN_V', longueur: 'MIDI' }, {
      construction: { items: [{ kind: 'GODETS', count: 6, heightMm: 380, widthMm: 300 }, { kind: 'LINING' }] },
    }),
    expect: ['^Godet \\(6', '^Doublure — Manche'],
  },
  {
    id: 'sirene-soiree',
    look: { fabricBehavior: 'STRUCTURE', fabricFinish: 'SATIN', fabricColor: '#0f6b45' },
    title: 'Sirène de soirée baleinée',
    era: 'Moderne',
    notes: 'Bustier cœur baleiné, sirène au sol, volant en forme au bas, doublure.',
    parameters: robe('SIRENE', { manches: 'SANS_MANCHES', decollete: 'COEUR', longueur: 'SOL', corsage: 'BALEINE' }, {
      construction: { items: [{ kind: 'HEM_FLOUNCE', tiers: 1, depthMm: 300, style: 'CIRCULAIRE' }, { kind: 'LINING' }] },
    }),
    expect: ['^Coulisse de baleine', '^Volant d’ourlet en forme', '^Doublure — Corsage'],
  },
  {
    id: 'peplum',
    // Photo: sleeveless brocade peplum dress (Commons, CC BY 2.0).
    look: { fabricBehavior: 'STRUCTURE', fabricPrint: 'BROCART', fabricColor: '#b5381f', motifColor: '#c9a45c' },
    title: 'Robe péplum',
    era: '1940 / 2010',
    notes: 'Basque rapportée en forme à la taille, sans manches, jupe droite au genou.',
    parameters: robe('AJUSTEE', { manches: 'SANS_MANCHES', col: 'ROND', longueur: 'GENOU', fermeture: 'ZIP_INVISIBLE' }, {
      construction: { items: [{ kind: 'PEPLUM', style: 'CIRCULAIRE', depthMm: 160 }] },
    }),
    expect: ['^Basque rapportée en forme'],
    absent: ['^Manche'],
  },
  {
    id: 'swing-50',
    look: { fabricBehavior: 'STRUCTURE', fabricPrint: 'FLEURI', fabricColor: '#f2efe8', motifColor: '#4a6fa5' },
    title: 'Robe swing années 50',
    era: '1950',
    notes: 'Jupe froncée très ample (bloc), col Claudine (chemisier), ceinture nouée, poches dans les coutures.',
    parameters: robe('PRINCESSE', { manches: 'COURTES', col: 'CHEMISIER', longueur: 'MIDI', fermeture: 'CEINTURE_NOUEE' }, {
      drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 2.5 }] },
      construction: { items: [{ kind: 'SEAM_POCKETS' }, { kind: 'INTERFACING' }] },
    }),
    expect: ['^Jupe froncée', '^Fond de poche dans la couture', '^Entoilage — Col'],
  },
  {
    id: 'babydoll',
    look: { fabricBehavior: 'STRUCTURE', fabricColor: '#141414' },
    title: 'Babydoll à volant',
    era: '1958 / 1990',
    notes: 'Fronces sous poitrine, petites manches bouffantes, volant d’ourlet froncé.',
    parameters: robe('EVASEE', { manches: 'COURTES', col: 'ROND', longueur: 'MINI', corsage: 'FRONCES_SOUS_POITRINE', taille: 'HAUTE' }, {
      fullness: { sleeve: 1.8 },
      lengths: { sleevePct: 22 },
      construction: { items: [{ kind: 'HEM_FLOUNCE', tiers: 1, depthMm: 120, style: 'FRONCE' }, { kind: 'PUFF_SUPPORT' }, { kind: 'SMOCKING', place: 'MANCHES', rows: 5, ratio: 3 }] },
    }),
    expect: ['^Empiècement Devant', '^Volant d’ourlet \\(froncé', '^Soutien de bouffant', '^Panneau à smocks \\(bas des bras'],
  },
  {
    id: 'flamenca',
    look: { fabricBehavior: 'FLUIDE', fabricPrint: 'POIS', fabricColor: '#efe8da', motifColor: '#222222' },
    title: 'Traje de flamenca',
    era: 'Andalousie (traditionnel)',
    notes: 'Sirène, trois volants en forme étagés, volants de manche, nœud d’épaule.',
    parameters: robe('SIRENE', { manches: 'COURTES', col: 'EN_V', longueur: 'SOL' }, {
      trims: { items: [{ kind: 'SLEEVE_FRILL', tiers: 2, depthMm: 90, material: 'TISSU' }] },
      construction: { items: [{ kind: 'HEM_FLOUNCE', tiers: 3, depthMm: 200, style: 'CIRCULAIRE' }, { kind: 'BOW', place: 'MANCHES', widthMm: 120 }] },
    }),
    expect: ['^Volant étagé 3/3 en forme', '^Volant de manche', '^Chou d’épaule — boucles'],
  },
  {
    id: 'charleston',
    look: { fabricBehavior: 'FLUIDE', fabricPrint: 'AUTRE', fabricColor: '#8f8170', motifColor: '#d9cfbf' },
    title: 'Robe Charleston perlée',
    era: '1925',
    notes: 'Taille basse, droite sans manches, bandes appliquées superposées (franges), perles.',
    parameters: robe('DROITE', { manches: 'SANS_MANCHES', col: 'EN_V', longueur: 'GENOU', taille: 'BASSE' }, {
      trims: { items: [{ kind: 'BEADING', place: 'ENCOLURE', beadMm: 3, rows: 2 }] },
      construction: { items: [{ kind: 'HEM_BANDS', rows: 3, widthMm: 60, gapMm: 30 }, { kind: 'BIAS_BINDING', widthMm: 25 }] },
    }),
    expect: ['^Bande appliquée 3/3'],
  },
  {
    id: 'grecque',
    look: { fabricBehavior: 'FLUIDE', fabricColor: '#1f2a6b' },
    title: 'Robe grecque drapée',
    era: 'Néo-antique (1930 / 1970)',
    notes: 'Corsage drapé, sans manches, écharpe drapée en biais sur l’épaule.',
    parameters: robe('DROITE', { manches: 'SANS_MANCHES', col: 'EN_V', longueur: 'SOL' }, {
      drape: { blocks: [{ kind: 'DRAPED_BODICE', pleats: 4, side: 'LEFT' }] },
      construction: { items: [{ kind: 'SASH', widthMm: 300, lengthMm: 2400 }] },
    }),
    expect: ['drapé', '^Écharpe drapée'],
  },
  {
    id: 'kimono',
    look: { fabricBehavior: 'STRUCTURE', fabricPrint: 'CARREAUX', fabricColor: '#5b7fa8', motifColor: '#e8eef5' },
    title: 'Robe kimono à goussets',
    era: 'Japonisme / moderne',
    notes: 'Manches kimono coupées avec le corps, goussets de dessous de bras, écharpe nouée (obi).',
    parameters: robe('DROITE', { manches: 'KIMONO', col: 'EN_V', longueur: 'MIDI' }, {
      construction: { items: [{ kind: 'UNDERARM_GUSSET', sizeMm: 110 }, { kind: 'SASH', widthMm: 250, lengthMm: 3200 }] },
    }),
    expect: ['^Gousset de dessous de bras', '^Écharpe drapée \\(biais, en 2 parties'],
  },
  {
    id: 'caftan',
    look: { fabricBehavior: 'FLUIDE', fabricPrint: 'BROCART', fabricColor: '#a9c6d8', motifColor: '#c48a3a' },
    title: 'Caftan',
    era: 'Afrique du Nord / 1970',
    notes: 'Ample, manches kimono, col V, au sol, biais d’encolure.',
    parameters: robe('OVERSIZE', { manches: 'KIMONO', col: 'EN_V', longueur: 'SOL' }, {
      construction: { items: [{ kind: 'BIAS_BINDING', widthMm: 35 }] },
    }),
    expect: ['^Biais d’encolure'],
    absent: ['^Biais d’emmanchure'],
  },
  {
    id: 'chasuble',
    look: { fabricBehavior: 'STRUCTURE', fabricPrint: 'RAYURES', fabricColor: '#e5462e', motifColor: '#2f7de1' },
    title: 'Robe chasuble (pinafore) à tablier',
    era: 'Moderne / dirndl',
    notes: 'Sans manches, encolure carrée, poches, tablier froncé et ses liens.',
    parameters: robe('EVASEE', { manches: 'SANS_MANCHES', decollete: 'CARRE', longueur: 'MIDI', fermeture: 'BOUTONS' }, {
      construction: { items: [{ kind: 'SEAM_POCKETS' }, { kind: 'APRON', lengthMm: 550, fullness: 1.4 }] },
    }),
    expect: ['^Tablier', '^Lien de tablier', '^Fond de poche'],
  },
  {
    id: 'dirndl',
    // Photo: dirndl on a shop mannequin, St. Pölten (Commons, Ralf Roletschek, CC BY 3.0): dark striped bodice,
    // pink-and-green trim at the neckline, lime apron. The 3D draws the apron in `contrastColor` (not its own colour).
    look: { fabricBehavior: 'STRUCTURE', fabricPrint: 'RAYURES', fabricColor: '#2b2b30', motifColor: '#8f8f96', contrastColor: '#8cc63f' },
    title: 'Dirndl',
    era: 'Alpes (traditionnel)',
    notes: 'Corsage ajusté carré, jupe froncée ample, tablier contrasté.',
    parameters: robe('AJUSTEE', { manches: 'SANS_MANCHES', decollete: 'CARRE', longueur: 'MIDI', fermeture: 'BOUTONS' }, {
      drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 2.5 }] },
      construction: {
        items: [
          { kind: 'APRON', lengthMm: 600, fullness: 1.6, color: '#8cc63f' },
          { kind: 'LINING', parts: ['CORSAGE'] },
          { kind: 'EMBROIDERY', place: 'ENCOLURE', widthMm: 50, color: '#e0458a' },
        ],
      },
    }),
    expect: ['^Tablier', '^Doublure — Corsage', '^Gabarit de broderie \\(encolure'],
    absent: ['^Doublure — Jupe'],
  },
  {
    id: 'qipao',
    look: { fabricBehavior: 'STRUCTURE', fabricPrint: 'FLEURI', fabricColor: '#1f3a8a', motifColor: '#eef0f5' },
    title: 'Qipao (cheongsam)',
    era: 'Shanghai 1930–1960',
    notes: 'Col officier mandarin, mancherons, ajustée, finitions au biais (passepoil), boutonnage.',
    parameters: robe('AJUSTEE', { manches: 'CAP', col: 'OFFICIER', longueur: 'MIDI', fermeture: 'BOUTONS' }, {
      construction: { items: [{ kind: 'BIAS_BINDING', widthMm: 20 }, { kind: 'INTERFACING' }, { kind: 'LINING' }] },
    }),
    expect: ['^Col officier', '^Entoilage — Col officier', '^Biais d’encolure'],
  },
  {
    id: 'robe-manteau',
    look: { fabricBehavior: 'STRUCTURE', fabricFinish: 'VELOURS', fabricColor: '#1c2347', contrastColor: '#d9ccb0' },
    title: 'Robe-manteau à revers, doublée',
    era: 'Moderne / 1900',
    notes: 'Devant ouvert à revers sur plastron, col châle, doublure et entoilage complets.',
    parameters: robe('PRINCESSE', { manches: 'LONGUES', col: 'CHALE', longueur: 'SOL', devant: 'MANTEAU_REVERS', fermeture: 'BOUTONS' }, {
      construction: { items: [{ kind: 'LINING' }, { kind: 'INTERFACING' }] },
    }),
    expect: ['^Plastron', '^Revers', '^Parementure Devant', '^Entoilage — Parementure', '^Entoilage — Revers', '^Doublure — Manche'],
  },
  {
    id: 'paysanne-smocks',
    // Photo: Liberty & Co. smock dress, 1890s (The Met, CC0). The fiche follows the photo: no free photo of a
    // smocked peasant dress with hem embroidery was found (lot 4 of docs/plans/pattern-construction-suite.md).
    look: { fabricBehavior: 'FLUIDE', fabricColor: '#f1ede4' },
    title: 'Robe smock Liberty, smockée et brodée',
    era: '1890 (Liberty & Co.)',
    notes: 'Robe ample sur empiècement smocké, col plat brodé ton sur ton, manches évêque resserrées par des poignets smockés, au genou.',
    parameters: robe('EVASEE', { manches: 'EVEQUE', col: 'CHEMISIER', longueur: 'GENOU' }, {
      lengths: { sleevePct: 100 },
      construction: {
        items: [
          { kind: 'SMOCKING', place: 'CORSAGE', rows: 10, ratio: 3 },
          { kind: 'SMOCKING', place: 'MANCHES', rows: 5, ratio: 3 },
          { kind: 'EMBROIDERY', place: 'ENCOLURE', widthMm: 50, color: '#d8ccb0' },
        ],
      },
    }),
    expect: ['^Panneau à smocks \\(plastron', '^Panneau à smocks \\(bas des bras', '^Gabarit de broderie \\(encolure'],
    absent: ['^Volant'],
  },
  // ------------------------------------------------------------ historical, period order
  {
    id: 'francaise-1750',
    look: { fabricBehavior: 'STRUCTURE', fabricPrint: 'FLEURI', fabricFinish: 'SATIN', fabricColor: '#e6dcc4', motifColor: '#b77c6a', contrastColor: '#e6dcc4' },
    title: 'Robe à la française',
    era: '1740–1770',
    notes: 'Plis Watteau dans le dos, robe ouverte sur une pièce d’estomac, paniers, engageantes à trois volants, volants de manche au coude.',
    parameters: robe('EVASEE', { manches: 'TROIS_QUARTS', decollete: 'CARRE', longueur: 'SOL', devant: 'MANTEAU_OUVERT', corsage: 'BALEINE' }, {
      // Over side hoops (~1.8 m round): a skirt pleated in at the waist, 3 × its width, falls straight from them.
      drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 3 }] },
      trims: { items: [{ kind: 'SLEEVE_FRILL', tiers: 2, depthMm: 100, material: 'TISSU' }] },
      construction: {
        items: [
          { kind: 'WATTEAU_PLEAT', depthMm: 90 },
          { kind: 'BUSTLE', style: 'PANIERS' },
          { kind: 'ENGAGEANTES', tiers: 3, depthMm: 110 },
          { kind: 'HEM_BANDS', rows: 1, widthMm: 80, gapMm: 150, material: 'TISSU' },
        ],
      },
    }),
    expect: ['^Pli Watteau', '^Panier \\(poche de hanche', '^Engageante — volant 3/3', '^Engageante — bracelet', '^Plastron', '^Coulisse de baleine'],
  },
  {
    id: 'polonaise-1780',
    look: { fabricBehavior: 'STRUCTURE', fabricFinish: 'SATIN', fabricColor: '#c9971f' },
    title: 'Robe à la polonaise',
    era: '1775–1785',
    notes: 'Robe ouverte retroussée en pouf sur une tournure, fichu (pèlerine), volant d’ourlet du jupon.',
    parameters: robe('AJUSTEE', { manches: 'TROIS_QUARTS', decollete: 'CARRE', longueur: 'MAXI', devant: 'MANTEAU_OUVERT' }, {
      construction: {
        items: [
          { kind: 'BUSTLE', style: 'POUF' },
          { kind: 'CAPELET', lengthMm: 220, material: 'TULLE' },
          { kind: 'HEM_FLOUNCE', tiers: 1, depthMm: 180, style: 'FRONCE' },
        ],
      },
    }),
    expect: ['^Drapé de tournure \\(pouf', '^Coussin de tournure', '^Pèlerine', '^Volant d’ourlet'],
  },
  {
    id: 'regence-1810',
    look: { fabricBehavior: 'FLUIDE', fabricColor: '#d6a52b' },
    title: 'Robe Régence (Empire)',
    era: '1800–1820',
    notes: 'Taille sous la poitrine, petites manches bouffantes, encolure carrée, traîne courte, volant de bas, spencer remplacé par une pèlerine.',
    parameters: robe('EVASEE', { manches: 'COURTES', decollete: 'CARRE', longueur: 'SOL', taille: 'HAUTE' }, {
      fullness: { sleeve: 2, skirt: 1.6 },
      lengths: { sleevePct: 22 },
      drape: { blocks: [{ kind: 'TRAIN', lengthMm: 400 }] },
      construction: { items: [{ kind: 'HEM_FLOUNCE', tiers: 1, depthMm: 90, style: 'FRONCE' }, { kind: 'PUFF_SUPPORT' }, { kind: 'CAPELET', lengthMm: 150 }] },
    }),
    expect: ['^Traîne', '^Volant d’ourlet', '^Soutien de bouffant', '^Pèlerine'],
  },
  {
    id: 'romantique-1835',
    look: { fabricBehavior: 'STRUCTURE', fabricPrint: 'FLEURI', fabricColor: '#a3402a', motifColor: '#e0c9a0' },
    title: 'Robe romantique à manches gigot',
    era: '1828–1836',
    notes: 'Manches gigot, pèlerine de mousseline, ourlet à la cheville bordé de bandes, soutien de bouffant.',
    parameters: robe('EVASEE', { manches: 'BALLON', col: 'BATEAU', longueur: 'MAXI', fermeture: 'BOUTONS' }, {
      fullness: { sleeve: 2.2, skirt: 2.4 },
      construction: {
        items: [
          { kind: 'CAPELET', lengthMm: 280, material: 'TULLE' },
          { kind: 'HEM_BANDS', rows: 2, widthMm: 40, gapMm: 60, material: 'CONTRASTE' },
          { kind: 'PUFF_SUPPORT' },
        ],
      },
    }),
    expect: ['^Manche', '^Pèlerine', '^Bande appliquée 2/2', '^Soutien de bouffant'],
  },
  {
    id: 'crinoline-1855',
    look: { fabricBehavior: 'STRUCTURE', fabricColor: '#e4d8bd', motifColor: '#2d2a28' },
    title: 'Robe de bal à crinoline',
    era: '1850–1860',
    notes: 'Hors épaules, berthe de dentelle, volants de manche, corsage baleiné, jupe froncée sur crinoline, traîne, balayeuse, doublure.',
    parameters: robe('PRINCESSE', { manches: 'COURTES', decollete: 'HORS_EPAULES', longueur: 'SOL', corsage: 'BALEINE', taille: 'BASSE' }, {
      fullness: { skirt: 3.4, sleeve: 1.8 },
      drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 3.4 }, { kind: 'TRAIN', lengthMm: 500 }] },
      trims: {
        items: [
          { kind: 'BERTHE', depthMm: 90, pointMm: 60, material: 'DENTELLE' },
          { kind: 'SLEEVE_FRILL', tiers: 2, depthMm: 60, material: 'DENTELLE' },
          { kind: 'BEADING', place: 'ENCOLURE', beadMm: 6, rows: 1 },
        ],
      },
      construction: { items: [{ kind: 'BALAYEUSE', depthMm: 90 }, { kind: 'LINING', parts: ['CORSAGE'] }] },
    }),
    expect: ['hors épaules', '^Berthe Devant', '^Volant de manche', '^Traîne', '^Balayeuse', '^Doublure — Corsage Devant'],
  },
  {
    id: 'pagode-1860',
    look: { fabricBehavior: 'STRUCTURE', fabricFinish: 'SATIN', fabricPrint: 'POIS', fabricColor: '#5a2e1a', motifColor: '#c9b48a' },
    title: 'Robe de jour à manches pagode',
    era: '1855–1865',
    notes: 'Manches pagode (cloche) sur engageantes, col officier, boutonnage, jupe froncée, balayeuse.',
    parameters: robe('PRINCESSE', { manches: 'CLOCHE', col: 'OFFICIER', longueur: 'SOL', fermeture: 'BOUTONS' }, {
      fullness: { sleeve: 1.6 },
      drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 3 }] },
      construction: { items: [{ kind: 'ENGAGEANTES', tiers: 2, depthMm: 90 }, { kind: 'BALAYEUSE', depthMm: 70 }, { kind: 'INTERFACING' }] },
    }),
    expect: ['^Engageante — volant 2/2', '^Balayeuse', '^Entoilage — Col officier'],
  },
  {
    id: 'tournure-1885',
    look: { fabricBehavior: 'STRUCTURE', fabricFinish: 'SATIN', fabricColor: '#1f4d6b' },
    title: 'Robe à tournure en lés',
    era: '1883–1888',
    notes: 'Jupe en lés, col officier, manches longues, pouf sur tournure, basque à pointes rapportée, gros chou arrière, balayeuse.',
    parameters: robe('AJUSTEE', { manches: 'LONGUES', col: 'OFFICIER', longueur: 'SOL', jupe: 'EN_LES', fermeture: 'BOUTONS' }, {
      construction: {
        items: [
          { kind: 'BUSTLE', style: 'POUF' },
          { kind: 'PEPLUM', style: 'POINTES', depthMm: 180 },
          { kind: 'BOW', place: 'DOS', widthMm: 260 },
          { kind: 'BALAYEUSE', depthMm: 80 },
          { kind: 'INTERFACING' },
        ],
      },
    }),
    expect: ['^Jupe Côté Devant', '^Drapé de tournure', '^Basque à pointes', '^Chou arrière — pans', '^Balayeuse'],
  },
  {
    id: 'gibson-1895',
    look: { fabricBehavior: 'STRUCTURE', fabricFinish: 'SATIN', fabricColor: '#cfc3a8' },
    title: 'Robe Gibson à manches gigot',
    era: '1893–1897',
    notes: 'Gigot énorme sur soutien de tulle, jupe en lés évasée, col officier, jabot de dentelle, doublure.',
    parameters: robe('EVASEE', { manches: 'BALLON', col: 'OFFICIER', longueur: 'SOL', jupe: 'EN_LES', fermeture: 'BOUTONS' }, {
      fullness: { sleeve: 2.5, skirt: 2.2 },
      lengths: { sleevePct: 100 },
      construction: { items: [{ kind: 'PUFF_SUPPORT' }, { kind: 'JABOT', lengthMm: 220, tiers: 2 }, { kind: 'LINING' }, { kind: 'INTERFACING' }] },
    }),
    expect: ['^Manche extérieure', '^Poignet', '^Soutien de bouffant', '^Jabot plissé — volant 2/2', '^Doublure — Manche extérieure'],
  },
  {
    id: 'edouardienne-1905',
    look: { fabricBehavior: 'FLUIDE', fabricColor: '#efe6d3' },
    title: 'Robe édouardienne « lingerie »',
    era: '1900–1910',
    notes: 'Col montant, manches longues, deux volants étagés en forme au bas, traîne, jabot, balayeuse.',
    parameters: robe('EVASEE', { manches: 'LONGUES', col: 'OFFICIER', longueur: 'SOL' }, {
      drape: { blocks: [{ kind: 'TRAIN', lengthMm: 450 }] },
      construction: {
        items: [
          { kind: 'HEM_FLOUNCE', tiers: 2, depthMm: 180, style: 'CIRCULAIRE', material: 'DENTELLE' },
          { kind: 'JABOT', lengthMm: 160, tiers: 1 },
          { kind: 'BALAYEUSE', depthMm: 70 },
        ],
      },
    }),
    expect: ['^Volant étagé 2/2 en forme', '^Jabot', '^Traîne', '^Balayeuse'],
  },
  {
    id: 'titanic-1912',
    look: { fabricBehavior: 'FLUIDE', fabricColor: '#e3a79a' },
    title: 'Robe 1912 à surjupe',
    era: '1910–1914',
    notes: 'Taille haute, surjupe asymétrique, écharpe drapée à la taille.',
    parameters: robe('DROITE', { manches: 'COURTES', col: 'EN_V', longueur: 'SOL', taille: 'HAUTE' }, {
      drape: { blocks: [{ kind: 'OVERSKIRT', lengthPct: 70, side: 'LEFT' }] },
      construction: { items: [{ kind: 'SASH', widthMm: 200, lengthMm: 1800 }] },
    }),
    expect: ['^Surjupe', '^Écharpe drapée'],
  },
  {
    id: 'robe-de-style-1924',
    look: { fabricBehavior: 'STRUCTURE', fabricFinish: 'SATIN', fabricColor: '#151515', motifColor: '#d8d2c4' },
    title: 'Robe de style (Lanvin)',
    era: '1920–1926',
    notes: 'Corsage droit taille basse, jupe ample soutenue par des paniers, gros chou à la taille.',
    parameters: robe('DROITE', { manches: 'SANS_MANCHES', col: 'BATEAU', longueur: 'MIDI', taille: 'BASSE' }, {
      drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 2.8 }] },
      construction: { items: [{ kind: 'BUSTLE', style: 'PANIERS' }, { kind: 'BOW', place: 'TAILLE', widthMm: 200 }, { kind: 'BIAS_BINDING', widthMm: 25 }] },
    }),
    expect: ['^Panier', '^Chou de taille — boucles'],
  },
  {
    id: 'biais-1933',
    // Photo: Vionnet evening gown, ombré silk chiffon crepe, c. 1932 (RISD Museum, CC0).
    look: { fabricBehavior: 'FLUIDE', fabricColor: '#e6d6b4' },
    title: 'Robe du soir coupée dans le biais',
    era: '1930–1938 (Vionnet)',
    notes: 'Col bénitier, dos nu, godets dans les coutures, au sol, biais.',
    parameters: robe('AJUSTEE', { manches: 'SANS_MANCHES', longueur: 'SOL', dos: 'DOS_NU' }, {
      drape: { blocks: [{ kind: 'COWL_NECK', depthMm: 120 }] },
      construction: { items: [{ kind: 'GODETS', count: 4, heightMm: 450, widthMm: 350 }, { kind: 'BIAS_BINDING', widthMm: 20 }] },
    }),
    expect: ['bénitier', '^Godet \\(4'],
  },
  {
    id: 'tudor-1540',
    look: { fabricBehavior: 'RIGIDE', fabricFinish: 'VELOURS', fabricColor: '#8b2a1e', contrastColor: '#b9a27a' },
    title: 'Robe Tudor',
    era: '1530–1550',
    notes: 'Encolure carrée, corps baleiné, manches cloche sur fausses manches (engageantes), devant ouvert sur un devant de jupe (plastron).',
    parameters: robe('EVASEE', { manches: 'CLOCHE', decollete: 'CARRE', longueur: 'SOL', corsage: 'BALEINE', devant: 'MANTEAU_OUVERT' }, {
      fullness: { sleeve: 2, skirt: 2 },
      construction: { items: [{ kind: 'ENGAGEANTES', tiers: 1, depthMm: 120, material: 'TISSU' }, { kind: 'LINING' }] },
    }),
    expect: ['^Plastron', '^Engageante', '^Coulisse de baleine', '^Doublure — Manche'],
  },
  {
    id: 'houppelande-1400',
    look: { fabricBehavior: 'STRUCTURE', fabricFinish: 'VELOURS', fabricColor: '#2e6b2e' },
    title: 'Cotte médiévale à godets',
    era: '1350–1420',
    notes: 'Jupe en lés à godets (gores), manches longues ajustées à goussets, traîne.',
    parameters: robe('AJUSTEE', { manches: 'LONGUES', col: 'ROND', longueur: 'SOL', jupe: 'EN_LES', fermeture: 'BOUTONS' }, {
      drape: { blocks: [{ kind: 'TRAIN', lengthMm: 600 }] },
      construction: { items: [{ kind: 'GODETS', count: 8, heightMm: 600, widthMm: 400 }, { kind: 'UNDERARM_GUSSET', sizeMm: 90 }] },
    }),
    expect: ['^Godet \\(8', '^Gousset', '^Traîne', '^Jupe Côté'],
  },
  // ------------------------------------------------------------ bridal
  {
    id: 'mariee-bal',
    look: { fabricBehavior: 'STRUCTURE', fabricColor: '#f3eee4' },
    title: 'Robe de mariée de bal',
    era: 'Moderne',
    notes: 'Bustier princesse, jupon structurant, traîne, volant en forme, balayeuse (le jupon fait doublure : pas de double doublure de jupe).',
    parameters: mariee('PRINCESSE', { manches: 'SANS_MANCHES', longueur: 'SOL' }, {
      construction: { items: [{ kind: 'LINING' }, { kind: 'HEM_FLOUNCE', tiers: 1, depthMm: 250, style: 'CIRCULAIRE', material: 'TULLE' }, { kind: 'BALAYEUSE', depthMm: 80 }] },
    }),
    expect: ['^Bustier Devant', '^Jupon', '^Jupe Dos avec Traîne', '^Doublure — Bustier', '^Volant d’ourlet en forme', '^Balayeuse'],
    absent: ['^Doublure — Jupe'],
  },
  {
    id: 'mariee-sirene-dentelle',
    look: { fabricBehavior: 'STRUCTURE', fabricColor: '#efe7da' },
    title: 'Mariée sirène en dentelle, pèlerine',
    era: 'Moderne',
    notes: 'Sirène, manches longues en dentelle, pèlerine de tulle, chou arrière.',
    parameters: mariee('SIRENE', { manches: 'LONGUES', longueur: 'SOL' }, {
      construction: { items: [{ kind: 'CAPELET', lengthMm: 300, material: 'TULLE' }, { kind: 'BOW', place: 'DOS', widthMm: 300, material: 'TISSU' }] },
    }),
    expect: ['^Manche', '^Pèlerine', '^Chou arrière — boucles'],
  },
];

/** The catalogue shelf of a dress: bridal, historical (before 1940) or modern. */
export const catalogGroupOf = (c: DressCase): 'MODERNE' | 'HISTORIQUE' | 'MARIEE' => {
  if (c.group) return c.group;
  if (c.parameters.garmentType === 'ROBE_MARIEE') return 'MARIEE';
  const year = /(\d{4})/.exec(c.era);
  return year && Number(year[1]) < 1940 && !/moderne|traditionnel|folk/i.test(c.era) ? 'HISTORIQUE' : 'MODERNE';
};
