import type { Metadata } from 'next';

import { LEGAL_PAGES, LegalPage } from '@/features/pages-legales';

const content = LEGAL_PAGES['carrieres'];

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
};

export default function Page() {
  return <LegalPage content={content} />;
}
