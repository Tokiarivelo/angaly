'use client';

import React from 'react';

import type { SectionPreviewContent } from '../PreviewToggle';
import type { SectionImage } from '../SectionImageField';
import type { SectionDefinition } from '../../consts/section-catalog.const';
import { HeroCinematicPreview } from './HeroCinematicPreview';
import { EditorialSplitPreview } from './EditorialSplitPreview';
import { CardsGridPreview } from './CardsGridPreview';
import { StepsProcessPreview } from './StepsProcessPreview';
import { CtaBannerPreview } from './CtaBannerPreview';
import { QuoteEditorialPreview } from './QuoteEditorialPreview';
import { GalleryMosaicPreview } from './GalleryMosaicPreview';
import { NewsletterBlockPreview } from './NewsletterBlockPreview';
import { FaqAccordionPreview } from './FaqAccordionPreview';

interface CmsComponentRendererProps {
  page?: string | undefined;
  sectionKey?: string | undefined;
  content: SectionPreviewContent;
  image: SectionImage | null;
  definition?: SectionDefinition | undefined;
  isCompact?: boolean;
}

export const CmsComponentRenderer: React.FC<CmsComponentRendererProps> = ({
  page,
  sectionKey,
  content,
  image,
  definition: _definition,
  isCompact = false,
}) => {
  const data = content.dataJson ?? {};
  const templateKind = typeof data['templateKind'] === 'string' ? data['templateKind'] : undefined;

  // 1. Direct templateKind match from Template Atelier
  if (templateKind === 'hero-cinematic') {
    return (
      <HeroCinematicPreview
        eyebrow={typeof data['eyebrow'] === 'string' ? data['eyebrow'] : 'MAISON DE COUTURE — MADAGASCAR'}
        title={content.titleText}
        subtitle={content.subtitleText}
        body={content.bodyText}
        imageUrl={image?.url}
        imageAlt={image?.altText}
        primaryCta={content.ctaPrimaryLabel}
        secondaryCta={content.ctaSecondaryLabel}
        isCompact={isCompact}
      />
    );
  }

  if (templateKind === 'editorial-split') {
    return (
      <EditorialSplitPreview
        eyebrow={typeof data['eyebrow'] === 'string' ? data['eyebrow'] : content.subtitleText}
        title={content.titleText}
        body={content.bodyText}
        imageUrl={image?.url}
        imageAlt={image?.altText}
        primaryCta={content.ctaPrimaryLabel}
        imagePosition={data['imagePosition'] === 'right' ? 'right' : 'left'}
        isCompact={isCompact}
      />
    );
  }

  if (templateKind === 'cards-grid') {
    const rawItems = Array.isArray(data['items']) ? (data['items'] as any[]) : undefined;
    return (
      <CardsGridPreview
        title={content.titleText}
        subtitle={content.subtitleText}
        items={rawItems}
        isCompact={isCompact}
      />
    );
  }

  if (templateKind === 'steps-process') {
    const rawSteps = Array.isArray(data['steps']) ? (data['steps'] as any[]) : undefined;
    return (
      <StepsProcessPreview
        title={content.titleText}
        subtitle={content.subtitleText}
        steps={rawSteps}
        cta={content.ctaPrimaryLabel}
        isCompact={isCompact}
      />
    );
  }

  if (templateKind === 'cta-banner') {
    return (
      <CtaBannerPreview
        title={content.titleText}
        subtitle={content.subtitleText}
        body={content.bodyText}
        primaryCta={content.ctaPrimaryLabel}
        secondaryCta={content.ctaSecondaryLabel}
        theme={data['theme'] === 'ivory' ? 'ivory' : 'navy'}
        isCompact={isCompact}
      />
    );
  }

  if (templateKind === 'quote-editorial') {
    return (
      <QuoteEditorialPreview
        quote={typeof data['quote'] === 'string' ? data['quote'] : content.bodyText}
        title={content.titleText}
        authorName={typeof data['authorName'] === 'string' ? data['authorName'] : undefined}
        authorRole={typeof data['authorRole'] === 'string' ? data['authorRole'] : undefined}
        imageUrl={image?.url}
        imageAlt={image?.altText}
      />
    );
  }

  if (templateKind === 'gallery-mosaic') {
    const rawItems = Array.isArray(data['items']) ? (data['items'] as any[]) : undefined;
    return (
      <GalleryMosaicPreview
        title={content.titleText}
        subtitle={content.subtitleText}
        items={rawItems}
      />
    );
  }

  if (templateKind === 'newsletter-block') {
    return (
      <NewsletterBlockPreview
        title={content.titleText}
        subtitle={content.subtitleText}
        body={content.bodyText}
        cta={content.ctaPrimaryLabel}
      />
    );
  }

  if (templateKind === 'faq-accordion') {
    const rawItems = Array.isArray(data['items']) ? (data['items'] as any[]) : undefined;
    return (
      <FaqAccordionPreview
        title={content.titleText}
        subtitle={content.subtitleText}
        items={rawItems}
      />
    );
  }

  // 2. Exact match for Landing Page sections (`page === 'accueil'`)
  if (page === 'accueil') {
    if (sectionKey === 'hero') {
      return (
        <HeroCinematicPreview
          eyebrow={typeof data['eyebrow'] === 'string' ? data['eyebrow'] : 'MAISON DE COUTURE — MADAGASCAR'}
          title={content.titleText || 'ANGALY'}
          subtitle={content.subtitleText || "L'élégance, créée pour vous."}
          body={content.bodyText}
          imageUrl={image?.url}
          imageAlt={image?.altText}
          primaryCta={content.ctaPrimaryLabel || 'Prendre rendez-vous'}
          secondaryCta={content.ctaSecondaryLabel || 'Découvrir nos créations'}
          isCompact={isCompact}
        />
      );
    }

    if (sectionKey === 'maison') {
      return (
        <EditorialSplitPreview
          eyebrow={content.subtitleText || 'NOTRE SAVOIR-FAIRE'}
          title={content.titleText || 'Une maison de couture pensée pour vous.'}
          body={
            content.bodyText ||
            "Fondée au cœur de Madagascar, la Maison Angaly perpétue l'artisanat d'exception. Chaque création est le fruit d'une rencontre entre une vision, des matières nobles et le talent de nos artisans."
          }
          imageUrl={image?.url}
          imageAlt={image?.altText}
          primaryCta={content.ctaPrimaryLabel || 'Découvrir Angaly'}
          imagePosition="left"
          isCompact={isCompact}
        />
      );
    }

    if (sectionKey === 'univers') {
      const rawItems = Array.isArray(data['items']) ? (data['items'] as any[]) : undefined;
      return (
        <CardsGridPreview
          title={content.titleText || 'Univers'}
          subtitle="COLLECTIONS SIGNATURE"
          items={rawItems}
          isCompact={isCompact}
        />
      );
    }

    if (sectionKey === 'sur-mesure') {
      const rawSteps = Array.isArray(data['steps']) ? (data['steps'] as any[]) : undefined;
      return (
        <StepsProcessPreview
          title={content.titleText || "L'Expérience Sur Mesure"}
          subtitle={content.subtitleText || '7 étapes vers la perfection'}
          steps={rawSteps}
          cta={content.ctaPrimaryLabel || 'Créer ma tenue sur mesure'}
          isCompact={isCompact}
        />
      );
    }

    if (sectionKey === 'pattern-studio') {
      return (
        <section className="bg-angaly-navy-dark text-white p-6 sm:p-10 border border-angaly-royal-navy rounded-sm text-left">
          <div className="grid gap-6 lg:grid-cols-2 items-center">
            {image?.url ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xs border border-angaly-gold/30">
                <img src={image.url} alt={image.altText ?? 'Pattern Studio'} className="object-cover w-full h-full" />
              </div>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-xs bg-gradient-to-br from-angaly-navy-blue to-angaly-navy border border-angaly-gold/30 flex items-center justify-center">
                <span className="font-heading text-xl text-angaly-champagne italic">Angaly Pattern Studio</span>
              </div>
            )}
            <div className="space-y-3">
              <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-angaly-gold font-semibold block">
                {content.subtitleText || 'SERVICE EXCLUSIF'}
              </span>
              <h2 className="font-heading text-2xl sm:text-4xl text-white">
                {content.titleText || 'Angaly Pattern Studio'}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                {content.bodyText ||
                  "Découvrez notre atelier virtuel propulsé par l'IA. Visualisez vos idées, testez des coupes audacieuses et collaborez en temps réel avec nos maîtres tailleurs."}
              </p>
              {content.ctaPrimaryLabel && (
                <div className="pt-2">
                  <span className="inline-flex rounded-sm bg-angaly-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs">
                    {content.ctaPrimaryLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (sectionKey === 'newsletter') {
      return (
        <NewsletterBlockPreview
          title={content.titleText || 'Restez informée des nouvelles collections'}
          subtitle="CERCLE PRIVÉ"
          body="Recevez en avant-première nos invitations exclusives."
          cta="S’inscrire"
        />
      );
    }

    if (sectionKey === 'la-une' || sectionKey === 'ateliers' || sectionKey === 'journal') {
      return (
        <CtaBannerPreview
          title={content.titleText || (sectionKey === 'la-une' ? 'La Une' : sectionKey === 'ateliers' ? 'Nos Ateliers' : 'Le Journal Angaly')}
          subtitle="SECTION ACCUEIL"
          body="Présentation en avant-première des créations et temps forts de la Maison."
          primaryCta={content.ctaPrimaryLabel || 'Explorer'}
          theme="ivory"
          isCompact={isCompact}
        />
      );
    }
  }

  // 3. Fallback based on data structure
  if (Array.isArray(data['steps'])) {
    return (
      <StepsProcessPreview
        title={content.titleText}
        subtitle={content.subtitleText}
        steps={data['steps'] as any[]}
        cta={content.ctaPrimaryLabel}
        isCompact={isCompact}
      />
    );
  }

  if (Array.isArray(data['items'])) {
    const items = data['items'] as any[];
    if (items.length > 0 && ('question' in items[0] || 'answer' in items[0])) {
      return <FaqAccordionPreview title={content.titleText} subtitle={content.subtitleText} items={items} />;
    }
    return <CardsGridPreview title={content.titleText} subtitle={content.subtitleText} items={items} isCompact={isCompact} />;
  }

  if (image && content.bodyText) {
    return (
      <EditorialSplitPreview
        eyebrow={content.subtitleText}
        title={content.titleText}
        body={content.bodyText}
        imageUrl={image.url}
        imageAlt={image.altText}
        primaryCta={content.ctaPrimaryLabel}
        isCompact={isCompact}
      />
    );
  }

  // Default elegant couture banner
  return (
    <CtaBannerPreview
      title={content.titleText || 'Titre de la section'}
      subtitle={content.subtitleText || undefined}
      body={content.bodyText || undefined}
      primaryCta={content.ctaPrimaryLabel || undefined}
      secondaryCta={content.ctaSecondaryLabel || undefined}
      theme="ivory"
      isCompact={isCompact}
    />
  );
};
