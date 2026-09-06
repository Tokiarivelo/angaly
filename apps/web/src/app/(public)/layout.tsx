import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

// Mobile hamburger drawer / bottom bar / WhatsApp FAB are added by
// navigation-mobile's own feature (docs/pages/navigation-mobile.md) once all
// routes are known — Header/Footer here already work standalone.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
