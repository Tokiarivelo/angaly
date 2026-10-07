export type CmsComponentKind =
  | 'hero-cinematic'
  | 'editorial-split'
  | 'cards-grid'
  | 'steps-process'
  | 'cta-banner'
  | 'quote-editorial'
  | 'gallery-mosaic'
  | 'newsletter-block'
  | 'faq-accordion';

export interface CmsComponentItem {
  label?: string | null | undefined;
  title?: string | null | undefined;
  description?: string | null | undefined;
  imageUrl?: string | null | undefined;
  imageAlt?: string | null | undefined;
  href?: string | null | undefined;
  icon?: string | null | undefined;
  badge?: string | null | undefined;
}

export interface CmsTemplatePreset {
  id: string;
  name: string;
  category: 'hero' | 'editorial' | 'vitrine' | 'process' | 'engagement';
  kind: CmsComponentKind;
  description: string;
  defaultValues: {
    titleText: string;
    subtitleText?: string;
    bodyText?: string;
    ctaPrimaryLabel?: string;
    ctaPrimaryHref?: string;
    ctaSecondaryLabel?: string;
    ctaSecondaryHref?: string;
  };
  defaultImageUrl?: string;
  defaultImageAlt?: string;
  defaultDataJson: Record<string, unknown>;
}

export interface AddSectionPayload {
  page: string;
  sectionKey: string;
  label: string;
  kind: CmsComponentKind;
  titleText: string;
  subtitleText?: string | null;
  bodyText?: string | null;
  ctaPrimaryLabel?: string | null;
  ctaSecondaryLabel?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  dataJson?: Record<string, unknown>;
}
