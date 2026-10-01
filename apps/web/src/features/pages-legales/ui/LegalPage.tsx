import type { LegalPageContent } from '../consts/legal-pages.const';
import { LEGAL_LAST_UPDATE } from '../consts/legal-pages.const';

export function LegalPage({ content }: { content: LegalPageContent }) {
  return (
    <main className="bg-angaly-champagne/30 py-20">
      <article className="mx-auto max-w-3xl px-6">
        <header className="border-angaly-border mb-12 border-b pb-8">
          <h1 className="font-heading text-angaly-navy text-4xl md:text-5xl">{content.title}</h1>
          <p className="text-angaly-slate mt-4 text-lg">{content.intro}</p>
        </header>
        <div className="space-y-10">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-heading text-angaly-navy mb-3 text-2xl">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-angaly-slate mb-3 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
        <p className="text-angaly-warm-gray mt-16 text-sm">Dernière mise à jour : {LEGAL_LAST_UPDATE}</p>
      </article>
    </main>
  );
}
