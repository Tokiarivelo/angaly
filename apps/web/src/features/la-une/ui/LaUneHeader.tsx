// TODO(Phase 6): read from GET /api/content/sections?page=la-une once `content` exists
// (same pattern as apps/web/src/features/home/hooks/useHomeContent.ts).
export function LaUneHeader() {
  return (
    <header className="border-angaly-border mx-auto flex max-w-screen-2xl flex-col items-center border-b px-8 py-24 text-center md:py-32">
      <span className="text-angaly-slate mb-6 text-sm tracking-widest uppercase">Éditorial</span>
      <h1 className="font-heading text-5xl tracking-wider text-angaly-navy md:text-7xl lg:text-8xl">LA UNE</h1>
      <p className="font-heading mt-8 max-w-3xl text-xl text-angaly-navy italic md:text-2xl">
        Les créations qui incarnent l&apos;univers Angaly — sélectionnées et renouvelées par la
        maison.
      </p>
    </header>
  );
}
