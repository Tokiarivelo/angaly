/**
 * Real Stitch screen's copy is specific to "Robe Éternelle" (its embroidery,
 * its bodice) — no Prisma field carries a per-creation narrative like this,
 * so this section uses the maison's general savoir-faire statement instead
 * of fabricating creation-specific claims. Same tradeoff as the home page's
 * "Notre Savoir-Faire" section. No real photography yet — gradients stand
 * in for the 3 images.
 */
export function CraftsmanshipStory() {
  return (
    <section className="bg-angaly-warm-ivory px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="font-heading mb-6 text-3xl text-angaly-navy italic md:text-4xl">
            Le savoir-faire derrière cette création
          </h2>
          <p className="text-sm leading-relaxed text-angaly-slate">
            Chaque pièce Angaly naît d&apos;un dialogue entre la vision d&apos;une couturière et le geste
            d&apos;un artisan. Nos ateliers malgaches perpétuent des techniques transmises de génération en
            génération, du choix des matières les plus nobles jusqu&apos;à la dernière retouche.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="aspect-[4/5] rounded-sm bg-gradient-to-br from-angaly-champagne to-angaly-gold-light"
          />
          <div
            aria-hidden="true"
            className="aspect-[4/5] rounded-sm bg-gradient-to-br from-angaly-soft-navy to-angaly-navy md:translate-y-8"
          />
          <div
            aria-hidden="true"
            className="aspect-[4/5] rounded-sm bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue"
          />
        </div>
      </div>
    </section>
  );
}
