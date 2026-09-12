import type { Metadata } from 'next';

import { cormorantGaramond, inter } from '@/lib/fonts';
import { Providers } from '@/providers';

import './globals.css';

/**
 * `template` applies "%s | ANGALY" to every child route's `metadata.title` automatically —
 * a page-level `title` must be the bare page name only (e.g. "Contactez-nous"), never
 * "Contactez-nous | ANGALY", or the suffix doubles up in the rendered <title>.
 */
export const metadata: Metadata = {
  title: {
    default: 'ANGALY — Maison de couture',
    template: '%s | ANGALY',
  },
  description: "L'élégance, créée pour vous. Maison de couture malgache — sur-mesure, prêt-à-porter et Angaly Pattern Studio.",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorantGaramond.variable} font-sans antialiased`}>
        <Providers>
          {children}
          {modal}
        </Providers>
      </body>
    </html>
  );
}
