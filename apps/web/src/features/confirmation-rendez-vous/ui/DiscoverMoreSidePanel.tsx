import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

/** "En attendant" — desktop-only, purely static/decorative (no data fetch, never blocks the recap). */
export function DiscoverMoreSidePanel() {
  return (
    <div className="hidden lg:block">
      <div className="mb-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-angaly-border" />
        <span className="text-xs tracking-widest text-angaly-slate uppercase">En attendant</span>
        <span className="h-px flex-1 bg-angaly-border" />
      </div>

      <div className="space-y-4">
        <Link href={ROUTES.collections} className="group block border border-angaly-border p-4">
          <span className="text-xs tracking-widest text-angaly-slate uppercase">Collection</span>
          <div className="mt-2 flex items-center justify-between">
            <h4 className="font-heading text-angaly-navy">Découvrez nos créations</h4>
            <ArrowRight className="h-4 w-4 text-angaly-navy transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </div>
        </Link>
        <Link href={ROUTES.journal} className="group block border border-angaly-border p-4">
          <span className="text-xs tracking-widest text-angaly-slate uppercase">Editorial</span>
          <div className="mt-2 flex items-center justify-between">
            <h4 className="font-heading text-angaly-navy">Lisez notre Journal</h4>
            <ArrowRight className="h-4 w-4 text-angaly-navy transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </div>
        </Link>
      </div>
    </div>
  );
}
