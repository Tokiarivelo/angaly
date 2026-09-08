import type { Metadata } from 'next';

import { Page404 } from '@/features/page-404';

export const metadata: Metadata = {
  title: 'Page introuvable',
  description: "La page que vous cherchez n'existe plus ou a été déplacée.",
};

export default function NotFound() {
  return <Page404 />;
}
