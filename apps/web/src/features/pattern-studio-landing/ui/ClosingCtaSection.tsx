'use client';

import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useCreatePatternProject } from '../hooks/useCreatePatternProject';

interface ClosingCtaSectionProps {
  content: {
    title: string;
    subtitle: string;
    buttonText: string;
  };
}

export const ClosingCtaSection: React.FC<ClosingCtaSectionProps> = ({ content }) => {
  const { mutate: createProject, isPending } = useCreatePatternProject();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#061938] text-center border-t border-[#C5B190]/20">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-5xl text-white font-light mb-4">
          {content.title}
        </h2>
        <p className="text-[#D8D3C8] text-base font-light mb-10 max-w-xl mx-auto">
          {content.subtitle}
        </p>
        <button
          type="button"
          onClick={() => createProject({ garmentType: 'ROBE' })}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded bg-[#936C3E] text-white hover:bg-[#B59A70] text-sm uppercase tracking-wider font-semibold transition-all shadow-xl hover:shadow-[#936C3E]/25 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Initialisation du projet…</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>{content.buttonText}</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
