import type { Metadata } from 'next';

import { PretAPorterCataloguePage } from '@/features/pret-a-porter-catalogue';

export const metadata: Metadata = { title: 'Prêt-à-porter' };

export default function Page() {
  return <PretAPorterCataloguePage />;
}
