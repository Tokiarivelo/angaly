'use client';

import { ChevronDown } from 'lucide-react';

import { useFaqAccordion } from '../hooks/useFaqAccordion';
import type { SurMesureContent } from '../hooks/useSurMesureContent';

/** Accordion list, one item open at a time — délais, tarifs, essayages, livraison, acompte. */
export function FaqAccordion({ content }: { content: SurMesureContent['faq'] }) {
  const { openIndex, toggle } = useFaqAccordion();

  return (
    <section className="bg-white px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-heading mb-12 text-center text-4xl tracking-wide text-angaly-navy md:text-5xl">
          {content.title}
        </h2>
        <div className="border-angaly-border divide-angaly-border divide-y border-t border-b">
          {content.items.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `sur-mesure-faq-panel-${index}`;
            const buttonId = `sur-mesure-faq-button-${index}`;
            return (
              <div key={item.question}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(index)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="font-heading text-lg text-angaly-navy">{item.question}</span>
                    <ChevronDown
                      className={`text-angaly-navy h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                {isOpen && (
                  <div id={panelId} role="region" aria-labelledby={buttonId} className="pb-5">
                    <p className="text-sm font-light text-angaly-slate">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
