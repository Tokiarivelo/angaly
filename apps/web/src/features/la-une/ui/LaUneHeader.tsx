import type { LaUneContent } from '../hooks/useLaUneContent';

/** Real content — see docs/features/content.md ("Endpoint public") and hooks/useLaUneContent.ts. */
export function LaUneHeader({ content }: { content: LaUneContent['header'] }) {
  return (
    <header className="border-angaly-border mx-auto flex max-w-screen-2xl flex-col items-center border-b px-8 py-24 text-center md:py-32">
      <span className="text-angaly-slate mb-6 text-sm tracking-widest uppercase">{content.eyebrow}</span>
      <h1 className="font-heading text-5xl tracking-wider text-angaly-navy md:text-7xl lg:text-8xl">
        {content.title}
      </h1>
      <p className="font-heading mt-8 max-w-3xl text-xl text-angaly-navy italic md:text-2xl">{content.subtitle}</p>
    </header>
  );
}
