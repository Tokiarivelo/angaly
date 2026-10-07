import React from 'react';

interface CtaBannerPreviewProps {
  title?: string | null | undefined;
  subtitle?: string | null | undefined;
  body?: string | null | undefined;
  primaryCta?: string | null | undefined;
  secondaryCta?: string | null | undefined;
  theme?: 'navy' | 'ivory';
  isCompact?: boolean;
}

export const CtaBannerPreview: React.FC<CtaBannerPreviewProps> = ({
  title = 'Donnez Vie à Votre Projet d’Exception',
  subtitle = 'CONSULTATION PRIVÉE EN ATELIER',
  body = 'Nos maîtres tailleurs et modélistes vous accueillent sur rendez-vous pour concevoir une création unique.',
  primaryCta = 'Prendre un rendez-vous',
  secondaryCta = 'Nous contacter',
  theme = 'navy',
  isCompact = false,
}) => {
  const isNavy = theme === 'navy';

  return (
    <section
      data-testid="cta-banner-preview"
      className={`p-6 sm:p-12 text-center rounded-sm border transition-colors ${
        isNavy
          ? 'bg-angaly-navy text-white border-angaly-royal-navy shadow-sm'
          : 'bg-angaly-warm-ivory text-angaly-navy border-angaly-border'
      }`}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {subtitle && (
          <p
            className={`text-[10px] sm:text-xs tracking-[0.3em] uppercase font-semibold ${
              isNavy ? 'text-angaly-champagne' : 'text-angaly-slate'
            }`}
          >
            {subtitle}
          </p>
        )}
        <h2 className="font-heading text-2xl sm:text-4xl leading-tight">
          {title}
        </h2>
        {body && (
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isNavy ? 'text-white/80' : 'text-angaly-slate'
            }`}
          >
            {body}
          </p>
        )}

        <div className={`pt-4 flex flex-wrap justify-center gap-3 ${isCompact ? 'flex-col sm:flex-row' : ''}`}>
          {primaryCta && (
            <span
              className={`inline-flex items-center justify-center rounded-sm px-6 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors ${
                isNavy
                  ? 'border border-white bg-white text-angaly-navy hover:bg-angaly-warm-ivory'
                  : 'border border-angaly-navy bg-angaly-navy text-white hover:bg-angaly-navy-blue'
              }`}
            >
              {primaryCta}
            </span>
          )}
          {secondaryCta && (
            <span
              className={`inline-flex items-center justify-center rounded-sm px-6 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors ${
                isNavy
                  ? 'border border-white/70 bg-transparent text-white hover:bg-white hover:text-angaly-navy'
                  : 'border border-angaly-navy bg-transparent text-angaly-navy hover:bg-white'
              }`}
            >
              {secondaryCta}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
