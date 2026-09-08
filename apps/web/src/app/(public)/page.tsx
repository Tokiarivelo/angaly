import type { Metadata } from 'next';

import { HomePage } from '@/features/home';

/**
 * No `title` here — the root layout's `title.default` ("ANGALY — Maison de couture")
 * already covers the homepage; setting one here would apply the root's `%s | ANGALY`
 * template on top of it (double-suffixed "ANGALY — Maison de couture | ANGALY").
 */
export const metadata: Metadata = {
  description:
    "L'élégance, créée pour vous. Découvrez les créations, collections et le sur-mesure de la maison de couture ANGALY.",
};

export default function Page() {
  return <HomePage />;
}
