'use client';

import React from 'react';

import type { SectionPreviewContent } from '../PreviewToggle';
import type { SectionImage } from '../SectionImageField';
import { HeroCinematicPreview } from './HeroCinematicPreview';
import { EditorialSplitPreview } from './EditorialSplitPreview';
import { CardsGridPreview } from './CardsGridPreview';
import { StepsProcessPreview } from './StepsProcessPreview';
import { CtaBannerPreview } from './CtaBannerPreview';
import { NewsletterBlockPreview } from './NewsletterBlockPreview';

interface LiveLandingPagePreviewProps {
  currentSectionKey?: string | undefined;
  content: SectionPreviewContent;
  image: SectionImage | null;
  isMobile?: boolean;
}

/**
 * Renders the full Landing Page experience with the editor's live draft values injected
 * directly into the appropriate section slot.
 */
export const LiveLandingPagePreview: React.FC<LiveLandingPagePreviewProps> = ({
  currentSectionKey,
  content,
  image,
  isMobile = false,
}) => {
  const isEditing = (key: string) => currentSectionKey === key;
  const data = content.dataJson ?? {};

  return (
    <div
      data-testid="live-landing-page-preview"
      className="bg-angaly-ivory text-angaly-navy font-sans select-none overflow-y-auto max-h-[750px] shadow-lg border border-angaly-border rounded-sm"
    >
      {/* Mini Mock Navbar */}
      <div className="bg-angaly-navy text-white px-4 py-3 flex items-center justify-between border-b border-angaly-royal-navy sticky top-0 z-20">
        <span className="font-heading text-lg tracking-widest text-angaly-champagne">ANGALY</span>
        <div className="flex gap-4 text-[10px] uppercase tracking-wider text-white/70">
          <span>Créations</span>
          <span>Sur Mesure</span>
          <span>La Maison</span>
        </div>
      </div>

      {/* 1. Hero Section */}
      <div className={isEditing('hero') ? 'ring-2 ring-angaly-gold ring-offset-2' : ''}>
        {isEditing('hero') ? (
          <HeroCinematicPreview
            eyebrow={typeof data['eyebrow'] === 'string' ? data['eyebrow'] : undefined}
            title={content.titleText || 'ANGALY'}
            subtitle={content.subtitleText || "L'élégance, créée pour vous."}
            body={content.bodyText || undefined}
            imageUrl={image?.url}
            imageAlt={image?.altText}
            primaryCta={content.ctaPrimaryLabel || 'Prendre rendez-vous'}
            secondaryCta={content.ctaSecondaryLabel || 'Découvrir nos créations'}
            isCompact={isMobile}
          />
        ) : (
          <HeroCinematicPreview isCompact={isMobile} />
        )}
      </div>

      {/* 2. Maison Section */}
      <div className={isEditing('maison') ? 'ring-2 ring-angaly-gold ring-offset-2' : ''}>
        {isEditing('maison') ? (
          <EditorialSplitPreview
            eyebrow={content.subtitleText || 'NOTRE SAVOIR-FAIRE'}
            title={content.titleText || 'Une maison de couture pensée pour vous.'}
            body={content.bodyText || undefined}
            imageUrl={image?.url}
            imageAlt={image?.altText}
            primaryCta={content.ctaPrimaryLabel || 'Découvrir la Maison'}
            isCompact={isMobile}
          />
        ) : (
          <EditorialSplitPreview isCompact={isMobile} />
        )}
      </div>

      {/* 3. Univers / Cards Section */}
      <div className={isEditing('univers') ? 'ring-2 ring-angaly-gold ring-offset-2' : ''}>
        {isEditing('univers') ? (
          <CardsGridPreview
            title={content.titleText || 'Nos Univers'}
            subtitle="COLLECTIONS SIGNATURE"
            items={Array.isArray(data['items']) ? (data['items'] as any[]) : undefined}
            isCompact={isMobile}
          />
        ) : (
          <CardsGridPreview isCompact={isMobile} />
        )}
      </div>

      {/* 4. Sur Mesure Steps Section */}
      <div className={isEditing('sur-mesure') ? 'ring-2 ring-angaly-gold ring-offset-2' : ''}>
        {isEditing('sur-mesure') ? (
          <StepsProcessPreview
            title={content.titleText || "L'Expérience Sur Mesure"}
            subtitle={content.subtitleText || '7 étapes vers la perfection'}
            steps={Array.isArray(data['steps']) ? (data['steps'] as any[]) : undefined}
            cta={content.ctaPrimaryLabel || 'Créer ma tenue sur mesure'}
            isCompact={isMobile}
          />
        ) : (
          <StepsProcessPreview isCompact={isMobile} />
        )}
      </div>

      {/* 5. Custom Injected Section (if not one of the default 4) */}
      {currentSectionKey && !['hero', 'maison', 'univers', 'sur-mesure', 'newsletter'].includes(currentSectionKey) && (
        <div className="ring-2 ring-angaly-gold ring-offset-2 my-2">
          <CtaBannerPreview
            title={content.titleText || 'Nouvelle Section Personnalisée'}
            subtitle={content.subtitleText || 'AJOUTÉE RÉCEMMENT'}
            body={content.bodyText || undefined}
            primaryCta={content.ctaPrimaryLabel || 'En savoir plus'}
            secondaryCta={content.ctaSecondaryLabel || undefined}
            theme="navy"
            isCompact={isMobile}
          />
        </div>
      )}

      {/* 6. Newsletter Section */}
      <div className={isEditing('newsletter') ? 'ring-2 ring-angaly-gold ring-offset-2' : ''}>
        {isEditing('newsletter') ? (
          <NewsletterBlockPreview
            title={content.titleText || 'Restez informée des nouvelles collections'}
            subtitle="CERCLE PRIVÉ"
            body={content.bodyText || undefined}
            cta={content.ctaPrimaryLabel || 'S’inscrire'}
          />
        ) : (
          <NewsletterBlockPreview />
        )}
      </div>

      {/* Mini Mock Footer */}
      <div className="bg-angaly-navy-dark text-white/50 text-[10px] p-6 text-center border-t border-angaly-royal-navy">
        <p className="font-heading text-angaly-champagne text-xs mb-1">ANGALY HAUTE COUTURE</p>
        <p>© 2026 ANGALY Madagascar. Tous droits réservés.</p>
      </div>
    </div>
  );
};
