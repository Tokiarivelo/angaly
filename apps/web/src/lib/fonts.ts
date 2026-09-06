import { Cormorant_Garamond, Inter } from 'next/font/google';

/**
 * Editorial serif for headings and large titles (spec §14 — priority 1).
 * Playfair Display is the documented fallback; swap here if Cormorant's
 * weight range proves too limited for a given design.
 */
export const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
  display: 'swap',
});

/** Clean sans-serif for UI, navigation, forms and body text (spec §14). */
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
