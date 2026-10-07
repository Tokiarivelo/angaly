'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question?: string | null | undefined;
  answer?: string | null | undefined;
  title?: string | null | undefined;
  description?: string | null | undefined;
}

interface FaqAccordionPreviewProps {
  title?: string | null | undefined;
  subtitle?: string | null | undefined;
  items?: FaqItem[] | undefined;
}

const DEFAULT_FAQ: FaqItem[] = [
  {
    question: 'Combien de temps à l’avance réserver un rendez-vous ?',
    answer: 'Nous recommandons de prendre contact 2 à 3 mois à l’avance pour une création sur mesure d’exception.',
  },
  {
    question: 'Combien d’essayages sont nécessaires ?',
    answer: 'En moyenne 3 à 4 essayages sont prévus pour garantir un tombé impeccable et des ajustements précis.',
  },
  {
    question: 'Proposez-vous des rendez-vous à distance ?',
    answer: 'Oui, grâce à Angaly Pattern Studio, nous réalisons des consultations vidéo accompagnées de prise de mesures guidée.',
  },
];

export const FaqAccordionPreview: React.FC<FaqAccordionPreviewProps> = ({
  title = 'Questions Fréquentes',
  subtitle = 'TOUT CE QU’IL FAUT SAVOIR',
  items,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const displayItems = items && items.length > 0 ? items : DEFAULT_FAQ;

  return (
    <section
      data-testid="faq-accordion-preview"
      className="bg-angaly-ivory/50 p-6 sm:p-10 border border-angaly-border rounded-sm text-left"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {subtitle && (
            <p className="text-[10px] sm:text-xs tracking-[0.3em] text-angaly-slate uppercase font-semibold mb-1">
              {subtitle}
            </p>
          )}
          <h2 className="font-heading text-2xl sm:text-3xl text-angaly-navy">
            {title}
          </h2>
        </div>

        <div className="divide-y divide-angaly-border">
          {displayItems.map((item, index) => {
            const q = item.question ?? item.title ?? `Question ${index + 1}`;
            const a = item.answer ?? item.description ?? '';
            const isOpen = openIndex === index;

            return (
              <div key={index} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold text-angaly-navy hover:text-angaly-gold transition-colors gap-4"
                >
                  <span className="font-heading text-base sm:text-lg">{q}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 transition-transform duration-200 text-angaly-gold ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && a && (
                  <p className="mt-2.5 text-xs sm:text-sm text-angaly-slate leading-relaxed font-sans pr-6">
                    {a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
