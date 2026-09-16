import type { ContactContent } from '../hooks/useContactContent';

/** Real Stitch "Contactez-nous" screen: centered header, subtle texture background (real content — see hooks/useContactContent.ts). */
export function ContactHeader({ content }: { content: ContactContent['header'] }) {
  return (
    <header className="w-full border-b border-angaly-border/50 bg-angaly-ivory px-8 py-24 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading mb-6 text-5xl tracking-wide text-angaly-navy md:text-6xl lg:text-7xl">
          {content.title}
        </h1>
        <p className="mx-auto max-w-xl text-lg font-light tracking-wide text-angaly-slate md:text-xl">
          {content.subtitle}
        </p>
      </div>
    </header>
  );
}
