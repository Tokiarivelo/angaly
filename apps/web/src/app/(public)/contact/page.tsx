import type { Metadata } from 'next';

import { ContactPage } from '@/features/contact';

export const metadata: Metadata = {
  title: 'Contactez-nous',
  description: 'Une question, un projet ? Nous sommes à votre écoute.',
};

export default function Page() {
  return <ContactPage />;
}
