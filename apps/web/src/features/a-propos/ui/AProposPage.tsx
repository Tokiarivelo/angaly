import { useAProposContent } from '../hooks/useAProposContent';
import { AtelierGallerySection } from './AtelierGallerySection';
import { FondatriceSection } from './FondatriceSection';
import { HistoireHeroSection } from './HistoireHeroSection';
import { NotreHistoireSection } from './NotreHistoireSection';
import { PhilosophieQuoteBand } from './PhilosophieQuoteBand';
import { SavoirFaireSection } from './SavoirFaireSection';
import { VisionClosingSection } from './VisionClosingSection';

/**
 * Orchestrates the real Stitch "Notre Histoire (À propos)" screen — 7
 * sections, JSX + hooks only. No "Valeurs" section: the real screen doesn't
 * have one, unlike stitch-prompts/21-a-propos.md's 8-section plan.
 */
export function AProposPage() {
  const { data: content } = useAProposContent();

  return (
    <>
      <HistoireHeroSection content={content.hero} />
      <NotreHistoireSection content={content.histoire} />
      <FondatriceSection content={content.fondatrice} />
      <SavoirFaireSection content={content.savoirFaire} />
      <PhilosophieQuoteBand content={content.philosophie} />
      <AtelierGallerySection content={content.atelier} />
      <VisionClosingSection content={content.vision} />
    </>
  );
}
