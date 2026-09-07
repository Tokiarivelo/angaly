import type { Metadata } from 'next';

import { AProposPage } from '@/features/a-propos';

export const metadata: Metadata = {
  title: 'Notre histoire | ANGALY',
  description: 'Une maison de couture née à Madagascar, pensée pour durer.',
};

export default function Page() {
  return <AProposPage />;
}
