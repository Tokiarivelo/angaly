import { useSurMesureContent } from '../hooks/useSurMesureContent';
import { ClosingCtaBand } from './ClosingCtaBand';
import { FaqAccordion } from './FaqAccordion';
import { HeroSection } from './HeroSection';
import { ProcessTimeline } from './ProcessTimeline';
import { RealisationsGallery } from './RealisationsGallery';
import { TestimonialBlock } from './TestimonialBlock';
import { WhyChooseSection } from './WhyChooseSection';

/** Orchestrates the 7 sections of the real Stitch "ANGALY — L'Art du Sur Mesure" screen — JSX + hooks only. */
export function SurMesureProcessPage() {
  const { data: content } = useSurMesureContent();

  return (
    <>
      <HeroSection content={content.hero} />
      <ProcessTimeline />
      <WhyChooseSection content={content.whyChoose} />
      <RealisationsGallery content={content.gallery} />
      <TestimonialBlock content={content.testimonial} />
      <FaqAccordion content={content.faq} />
      <ClosingCtaBand content={content.closing} />
    </>
  );
}
