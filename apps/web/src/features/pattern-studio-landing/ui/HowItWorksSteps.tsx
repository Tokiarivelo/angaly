'use client';

import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { HowItWorksStep } from '../consts/how-it-works-steps.const';
import { useCreatePatternProject } from '../hooks/useCreatePatternProject';

interface HowItWorksStepsProps {
  content: {
    title: string;
    subheading: string;
    steps: HowItWorksStep[];
  };
}

export const HowItWorksSteps: React.FC<HowItWorksStepsProps> = ({ content }) => {
  const { mutate: createProject, isPending } = useCreatePatternProject();
  const [clickedStep, setClickedStep] = useState<number | null>(null);

  const handleStepClick = (stepNumber: number) => {
    setClickedStep(stepNumber);
    createProject({ garmentType: 'ROBE' });
  };

  return (
    <section id="comment-ca-fonctionne" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#061938]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-light mb-3">
            {content.title}
          </h2>
          <p className="text-[#D8D3C8] text-base font-light">
            {content.subheading}
          </p>
        </div>

        {/* Desktop Grid / Stepper */}
        <div className="hidden lg:grid grid-cols-4 gap-6">
          {content.steps.map((step) => (
            <button
              key={step.number}
              type="button"
              onClick={() => handleStepClick(step.number)}
              disabled={isPending}
              className="bg-[#0C2650] border border-[#C5B190]/20 rounded-xl p-6 relative flex flex-col justify-between text-left hover:border-[#C5B190]/80 hover:bg-[#0E2C5D] hover:shadow-lg hover:shadow-[#041329]/50 focus:outline-none focus:ring-2 focus:ring-[#C5B190] transition-all group cursor-pointer disabled:opacity-60"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-full border border-[#C5B190] text-[#C5B190] flex items-center justify-center text-xs font-serif font-bold group-hover:bg-[#C5B190] group-hover:text-[#041329] transition-colors">
                    {isPending && clickedStep === step.number ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#C5B190]" />
                    ) : (
                      step.number
                    )}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#C5B190]/60 font-medium">
                    {step.category}
                  </span>
                </div>
                <h3 className="text-white font-medium text-base mb-2 group-hover:text-[#C5B190] transition-colors">
                  {step.label}
                </h3>
                <p className="text-[#D8D3C8] text-xs leading-relaxed font-light">
                  {step.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#C5B190]/10 flex items-center justify-between text-[11px] text-[#C5B190]/70 group-hover:text-[#C5B190] transition-colors w-full">
                <span>
                  {isPending && clickedStep === step.number
                    ? 'Création en cours…'
                    : 'Créer mon patron'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Mobile / Tablet Vertical Stepper */}
        <div className="lg:hidden relative pl-6 border-l-2 border-[#C5B190]/30 ml-4 space-y-6">
          {content.steps.map((step) => (
            <div key={step.number} className="relative">
              {/* Step indicator dot */}
              <span className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-[#0C2650] border border-[#C5B190] text-[#C5B190] flex items-center justify-center text-xs font-serif font-bold">
                {isPending && clickedStep === step.number ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#C5B190]" />
                ) : (
                  step.number
                )}
              </span>
              <button
                type="button"
                onClick={() => handleStepClick(step.number)}
                disabled={isPending}
                className="w-full text-left bg-[#0C2650] border border-[#C5B190]/20 rounded-lg p-5 hover:border-[#C5B190]/80 hover:bg-[#0E2C5D] transition-all cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-medium text-base group-hover:text-[#C5B190] transition-colors">
                    {step.label}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-[#C5B190]/60">
                    {step.category}
                  </span>
                </div>
                <p className="text-[#D8D3C8] text-xs font-light leading-relaxed mb-3">
                  {step.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#C5B190]/70 group-hover:text-[#C5B190] transition-colors pt-2 border-t border-[#C5B190]/10">
                  <span>
                    {isPending && clickedStep === step.number
                      ? 'Création en cours…'
                      : 'Créer mon patron'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
