import { cmsList, cmsText, dataString, readString } from '@/lib/cms/cms-values';
import { useCmsPage } from '@/lib/cms/use-cms-page';

export interface ContactChannels {
  titles: { reach: string; socials: string; hours: string };
  phone: { label: string; href: string };
  whatsapp: { href: string };
  email: { label: string; href: string };
  socials: { label: string; href: string }[];
  hours: { label: string; value: string; isClosed?: boolean }[];
}

const DEFAULT_CHANNELS: ContactChannels = {
  titles: { reach: 'Nous joindre', socials: 'Réseaux', hours: 'Nos horaires' },
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

/**
 * Real screen's "Nous joindre"/"Réseaux"/"Nos horaires" — general contact info, not tied to one specific
 * atelier. Editable in the CMS (`page="contact"`: `coordonnees` — phone/WhatsApp/email in `dataJson`,
 * `reseaux` and `horaires` — lists in `dataJson`); anything missing keeps the built-in default.
 */
export function useContactChannels(): ContactChannels {
  const cms = useCmsPage('contact');
  const reach = cms.section('coordonnees');
  const socials = cms.section('reseaux');
  const hours = cms.section('horaires');
  const base = DEFAULT_CHANNELS;

  return {
    titles: {
      reach: cmsText(reach?.titleText, base.titles.reach),
      socials: cmsText(socials?.titleText, base.titles.socials),
      hours: cmsText(hours?.titleText, base.titles.hours),
    },
    phone: {
      label: dataString(reach?.dataJson, 'phoneLabel') ?? base.phone.label,
      href: dataString(reach?.dataJson, 'phoneHref') ?? base.phone.href,
    },
    whatsapp: { href: dataString(reach?.dataJson, 'whatsappHref') ?? base.whatsapp.href },
    email: {
      label: dataString(reach?.dataJson, 'emailLabel') ?? base.email.label,
      href: dataString(reach?.dataJson, 'emailHref') ?? base.email.href,
    },
    socials:
      cmsList(socials?.dataJson, 'links', (item) => {
        const label = readString(item['label']);
        const href = readString(item['href']);
        return label && href ? { label, href } : undefined;
      }) ?? base.socials,
    hours:
      cmsList(hours?.dataJson, 'rows', (item) => {
        const label = readString(item['label']);
        const value = readString(item['value']);
        return label && value ? { label, value, isClosed: item['closed'] === 'oui' } : undefined;
      }) ?? base.hours,
  };
}
