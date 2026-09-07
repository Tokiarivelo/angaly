/**
 * Real screen's mini map: a single centered navy pin over a muted stylized background —
 * same "static styled placeholder, not a real map library" finding as nos-ateliers-liste
 * (see docs/pages/nos-ateliers-liste.md "Points d'attention"), reused here in CSS for a
 * single atelier (no hover-sync needed — there is only one pin).
 */
export function AtelierMiniMap() {
  return (
    <div className="relative min-h-[300px] flex-grow overflow-hidden bg-angaly-warm-ivory">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--angaly-ivory)',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(140,132,113,0.35) 59px, rgba(140,132,113,0.35) 60px),' +
            'repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(140,132,113,0.35) 59px, rgba(140,132,113,0.35) 60px),' +
            'radial-gradient(circle at 30% 70%, rgba(30,69,116,0.22), transparent 45%)',
        }}
      />
      <div className="absolute top-1/2 left-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-angaly-navy shadow-lg">
        <div className="h-2.5 w-2.5 rounded-full bg-white" aria-hidden="true" />
      </div>
    </div>
  );
}
