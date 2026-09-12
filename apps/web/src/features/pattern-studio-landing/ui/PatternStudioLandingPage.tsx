'use client';

import React from 'react';
import { PatternStudioHeader } from './PatternStudioHeader';
import { ResumeProjectBanner } from './ResumeProjectBanner';
import { PatternStudioHero } from './PatternStudioHero';
import { HowItWorksSteps } from './HowItWorksSteps';
import { TrustPositioningBlock } from './TrustPositioningBlock';
import { SamplePatternPreviewCard } from './SamplePatternPreviewCard';
import { PricingTiersSection } from './PricingTiersSection';
import { ClosingCtaSection } from './ClosingCtaSection';
import { PatternStudioFooter } from './PatternStudioFooter';
import { usePatternStudioLandingContent } from '../hooks/usePatternStudioLandingContent';

export const PatternStudioLandingPage = () => {
  const content = usePatternStudioLandingContent();

  return (
    <div className="min-h-screen bg-[#041329] text-white flex flex-col font-sans">
      <PatternStudioHeader />
      <ResumeProjectBanner />
      <main className="flex-1">
        <PatternStudioHero content={content.hero} />
        <HowItWorksSteps content={content.howItWorks} />
        <TrustPositioningBlock content={content.trustBlock} />
        <SamplePatternPreviewCard content={content.samplePreview} />
        <PricingTiersSection content={content.pricing} />
        <ClosingCtaSection content={content.closingCta} />
      </main>
      <PatternStudioFooter />
    </div>
  );
};
