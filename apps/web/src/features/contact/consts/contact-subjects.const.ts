/** Real Stitch "Contactez-nous" screen's <select> options, values match spec §92. */
export const CONTACT_SUBJECTS = [
  { value: 'general', label: 'Question générale' },
  { value: 'rdv', label: 'Rendez-vous' },
  { value: 'devis', label: 'Devis' },
  { value: 'sur_mesure', label: 'Sur mesure' },
  { value: 'presse', label: 'Presse' },
  { value: 'autre', label: 'Autre' },
] as const;

export type ContactSubjectValue = (typeof CONTACT_SUBJECTS)[number]['value'];
