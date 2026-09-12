'use client';

import React from 'react';
import { Plus, ArrowDown, Loader2 } from 'lucide-react';
import { useCreatePatternProject } from '../hooks/useCreatePatternProject';

interface PatternStudioHeroProps {
  content: {
    badge: string;
    title: string;
    subheading: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
}

export const PatternStudioHero: React.FC<PatternStudioHeroProps> = ({ content }) => {
  const { mutate: createProject, isPending } = useCreatePatternProject();

  const handleCreate = () => {
    createProject({ garmentType: 'ROBE' });
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('comment-ca-fonctionne');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[#041329]">
      {/* Subtle geometric pattern lines in low-opacity champagne */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#C5B190_1px,transparent_1px)] [background-size:24px_24px]" />
      
      <div className="relative max-w-4xl mx-auto text-center">
        {/* Label */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0C2650] border border-[#C5B190]/40 text-[#C5B190] text-xs uppercase tracking-widest font-semibold mb-6">
          <span>{content.badge}</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light text-white tracking-tight leading-tight mb-4">
          {content.title}
        </h1>

        {/* Subheading */}
        <p className="font-serif italic text-xl sm:text-2xl text-[#C5B190] mb-6">
          {content.subheading}
        </p>

        {/* Paragraph */}
        <p className="text-base sm:text-lg text-[#D8D3C8] max-w-2xl mx-auto font-light leading-relaxed mb-10">
          {content.description}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded bg-[#936C3E] text-white hover:bg-[#B59A70] text-sm uppercase tracking-wider font-semibold transition-all shadow-lg hover:shadow-[#936C3E]/20 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Création de votre projet…</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{content.ctaPrimary}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={scrollToHowItWorks}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded border border-[#C5B190] text-[#C5B190] hover:bg-[#C5B190]/10 text-sm uppercase tracking-wider font-semibold transition-colors"
          >
            <span>{content.ctaSecondary}</span>
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
