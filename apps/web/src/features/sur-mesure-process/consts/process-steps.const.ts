export interface ProcessStep {
  number: number;
  title: string;
}

/** The 8 steps of the bespoke journey — spec §15.1, stitch-prompts/11-sur-mesure-process.md section 2. */
export const PROCESS_STEPS: ProcessStep[] = [
  { number: 1, title: 'Votre idée' },
  { number: 2, title: 'Consultation' },
  { number: 3, title: 'Mesures' },
  { number: 4, title: 'Conception' },
  { number: 5, title: 'Patron' },
  { number: 6, title: 'Confection' },
  { number: 7, title: 'Essayage' },
  { number: 8, title: 'Livraison' },
];
