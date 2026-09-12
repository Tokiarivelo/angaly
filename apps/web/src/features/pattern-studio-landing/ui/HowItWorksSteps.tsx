import React from 'react';
import type { HowItWorksStep } from '../consts/how-it-works-steps.const';

interface HowItWorksStepsProps {
  content: {
    title: string;
    subheading: string;
    steps: HowItWorksStep[];
  };
}

export const HowItWorksSteps: React.FC<HowItWorksStepsProps> = ({ content }) => {
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
            <div
              key={step.number}
              tabIndex={0}
              className="bg-[#0C2650] border border-[#C5B190]/20 rounded-xl p-6 relative flex flex-col justify-between hover:border-[#C5B190]/60 focus:outline-none focus:ring-2 focus:ring-[#C5B190] transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-full border border-[#C5B190] text-[#C5B190] flex items-center justify-center text-xs font-serif font-bold group-hover:bg-[#C5B190] group-hover:text-[#041329] transition-colors">
                    {step.number}
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
            </div>
          ))}
        </div>

        {/* Mobile / Tablet Vertical Stepper */}
        <div className="lg:hidden relative pl-6 border-l-2 border-[#C5B190]/30 ml-4 space-y-8">
          {content.steps.map((step) => (
            <div key={step.number} className="relative">
              {/* Step indicator dot */}
              <span className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-[#0C2650] border border-[#C5B190] text-[#C5B190] flex items-center justify-center text-xs font-serif font-bold">
                {step.number}
              </span>
              <div className="bg-[#0C2650] border border-[#C5B190]/20 rounded-lg p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-medium text-base">
                    {step.label}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-[#C5B190]/60">
                    {step.category}
                  </span>
                </div>
                <p className="text-[#D8D3C8] text-xs font-light leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
