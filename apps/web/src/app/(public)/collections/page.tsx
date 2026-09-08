import type { Metadata } from 'next';

import { CollectionsListePage } from '@/features/collections-liste';

export const metadata: Metadata = {
  title: 'Nos Collections',
  description: 'Chaque collection raconte une histoire, une saison, une inspiration.',
};

export default function Page() {
  return <CollectionsListePage />;
}
