'use client';

import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import type { PricingTier } from '../consts/pricing-tiers.const';
import { useCreatePatternProject } from '../hooks/useCreatePatternProject';

interface PricingTiersSectionProps {
  content: {
    title: string;
    subtitle: string;
    tiers: PricingTier[];
  };
}

export const PricingTiersSection: React.FC<PricingTiersSectionProps> = ({ content }) => {
  const { mutate: createProject, isPending } = useCreatePatternProject();

  const handleSelectTier = (tier: PricingTier) => {
    // In Phase 4, selecting a tier opens the wizard directly
    createProject({ garmentType: 'ROBE', style: tier.id });
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#041329]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-light mb-3">
            {content.title}
          </h2>
          <p className="text-[#D8D3C8] text-sm font-light">
            {content.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {content.tiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-[#0C2650] rounded-2xl p-8 flex flex-col justify-between transition-all relative ${
                tier.isRecommended
                  ? 'border-2 border-[#C5B190] shadow-2xl scale-100 lg:-translate-y-2'
                  : 'border border-[#C5B190]/20 hover:border-[#C5B190]/40'
              }`}
            >
              {tier.isRecommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#936C3E] text-white text-[11px] uppercase tracking-widest font-semibold px-4 py-1 rounded-full shadow-md">
                    Recommandé
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-serif text-2xl text-white font-normal mb-2">
                  {tier.name}
                </h3>
                <div className="mb-4">
                  <span className="font-serif text-3xl font-light text-[#C5B190]">
                    {tier.price}
                  </span>
                </div>
                <p className="text-[#D8D3C8] text-xs font-light leading-relaxed mb-6">
                  {tier.description}
                </p>

                <div className="border-t border-[#C5B190]/20 pt-6 mb-8 space-y-3">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-xs text-[#D8D3C8]">
                      <span className="p-0.5 rounded-full bg-[#C5B190]/20 text-[#C5B190] mt-0.5 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectTier(tier)}
                disabled={isPending}
                className={`w-full py-3.5 px-6 rounded text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 ${
                  tier.isRecommended
                    ? 'bg-[#936C3E] text-white hover:bg-[#B59A70]'
                    : 'border border-[#C5B190] text-[#C5B190] hover:bg-[#C5B190]/10'
                }`}
              >
                <span>{tier.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
