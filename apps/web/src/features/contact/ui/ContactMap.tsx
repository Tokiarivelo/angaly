import { MapPin } from 'lucide-react';

/**
 * Real screen's map section: no interactive pins at all, just a full-bleed stylized
 * background with one centered info card — the same "static styled placeholder, not a real
 * map library" finding as nos-ateliers-liste/atelier-detail (see
 * docs/pages/nos-ateliers-liste.md "Points d'attention"), reused in CSS here too.
 */
export function ContactMap() {
  return (
    <section className="relative h-[500px] w-full border-t border-angaly-border">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--angaly-ivory)',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 89px, rgba(140,132,113,0.35) 89px, rgba(140,132,113,0.35) 90px),' +
            'repeating-linear-gradient(90deg, transparent, transparent 89px, rgba(140,132,113,0.35) 89px, rgba(140,132,113,0.35) 90px),' +
            'radial-gradient(circle at 35% 65%, rgba(30,69,116,0.22), transparent 45%)',
        }}
      />
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="max-w-sm border border-angaly-border bg-angaly-ivory/90 p-6 text-center shadow-sm backdrop-blur-sm">
          <MapPin className="mx-auto mb-2 h-8 w-8 text-angaly-gold" strokeWidth={1.5} aria-hidden="true" />
          <h3 className="font-heading mb-2 text-xl tracking-widest text-angaly-navy uppercase">Ateliers ANGALY</h3>
          <p className="text-sm text-angaly-slate">Retrouvez nos créations au cœur d&apos;Antananarivo.</p>
        </div>
      </div>
    </section>
  );
}
