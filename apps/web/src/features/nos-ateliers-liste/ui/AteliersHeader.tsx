/** Real Stitch "Nos Ateliers (Workshops & Locations)" screen: centered header, no breadcrumb. */
export function AteliersHeader() {
  return (
    <header className="w-full border-b border-angaly-border bg-angaly-ivory px-8 py-16 text-center">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="font-heading text-5xl tracking-wide text-angaly-navy md:text-6xl">Nos Ateliers</h1>
        <p className="mx-auto max-w-xl text-lg font-light text-angaly-slate">
          Venez découvrir notre savoir-faire dans l&apos;un de nos ateliers.
        </p>
      </div>
    </header>
  );
}
