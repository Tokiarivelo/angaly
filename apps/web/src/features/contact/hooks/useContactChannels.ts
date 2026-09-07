export interface ContactChannels {
  phone: { label: string; href: string };
  whatsapp: { href: string };
  email: { label: string; href: string };
  socials: { label: string; href: string }[];
  hours: { label: string; value: string; isClosed?: boolean }[];
}

/**
 * Real screen's "Nous joindre"/"Réseaux"/"Nos horaires" — general contact info, not tied to
 * one specific atelier. Hardcoded in Phase 1 pending `content` (Phase 6), same treatment as
 * docs/pages/home.md/docs/pages/a-propos.md's own static editorial values.
 */
export function useContactChannels(): ContactChannels {
  return {
    phone: { label: '+261 20 22 123 45', href: 'tel:+261202212345' },
    whatsapp: { href: 'https://wa.me/261202212345' },
    email: { label: 'contact@angaly.mg', href: 'mailto:contact@angaly.mg' },
    socials: [
      { label: 'Facebook', href: '#' },
      { label: 'Instagram', href: '#' },
    ],
    hours: [
      { label: 'Lun - Ven', value: '09:00 - 18:00' },
      { label: 'Samedi', value: '10:00 - 17:00' },
      { label: 'Dimanche', value: 'Fermé', isClosed: true },
    ],
  };
}
