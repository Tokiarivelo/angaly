// Foundation placeholder — proves the app boots. Replaced by the real
// `home` feature root component in docs/phases/phase-1-digital-presence.md
// (see docs/pages/home.md and stitch-prompts/01-home.md).
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-angaly-champagne text-xs tracking-[0.3em] uppercase">
        Maison de couture — Madagascar
      </p>
      <h1 className="font-heading text-5xl">ANGALY</h1>
      <p className="font-heading text-angaly-slate text-xl italic">
        L&apos;élégance, créée pour vous.
      </p>
      <p className="text-angaly-slate max-w-md text-sm">
        Fondation du monorepo en place — cette page sera remplacée par la page d&apos;accueil
        réelle en Phase 1 (voir docs/phases/phase-1-digital-presence.md).
      </p>
    </main>
  );
}
