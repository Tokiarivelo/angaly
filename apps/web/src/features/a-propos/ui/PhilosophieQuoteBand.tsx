import type { AProposContent } from '../hooks/useAProposContent';

/** Real Stitch screen's full-width philosophy quote band: navy-blue bg, giant low-opacity quotation marks. */
export function PhilosophieQuoteBand({ content }: { content: AProposContent['philosophie'] }) {
  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-angaly-navy-blue py-32">
      <span aria-hidden="true" className="text-angaly-champagne/20 font-heading pointer-events-none absolute top-10 left-10 text-[15rem] leading-none">
        &ldquo;
      </span>
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p className="font-heading text-3xl leading-relaxed text-white italic md:text-5xl">{content.quote}</p>
        <div aria-hidden="true" className="bg-angaly-champagne mx-auto mt-8 h-px w-16" />
      </div>
      <span aria-hidden="true" className="text-angaly-champagne/20 font-heading pointer-events-none absolute right-10 bottom-[-5rem] rotate-180 text-[15rem] leading-none">
        &ldquo;
      </span>
    </section>
  );
}
