import { MobileNavigationShell } from '@/components/navigation/MobileNavigationShell';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    // pb-24: clears the fixed mobile bottom bar (h-16 + its raised CTA) below `lg:` — the
    // footer would otherwise sit partly underneath it once scrolled to the page bottom.
    <div className="pb-24 lg:pb-0">
      <Header />
      <main>{children}</main>
      <Footer />
      <MobileNavigationShell />
    </div>
  );
}
