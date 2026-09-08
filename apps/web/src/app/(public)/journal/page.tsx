import type { Metadata } from 'next';

import { JournalListePage } from '@/features/journal-liste';

export const metadata: Metadata = {
  title: 'Le Journal',
  description: "Mariage, mode, coulisses d'atelier et conseils d'entretien.",
};

export default function Page() {
  return <JournalListePage />;
}
