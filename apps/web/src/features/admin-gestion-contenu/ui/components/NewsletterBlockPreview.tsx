import React from 'react';

interface NewsletterBlockPreviewProps {
  title?: string | null | undefined;
  subtitle?: string | null | undefined;
  body?: string | null | undefined;
  cta?: string | null | undefined;
}

export const NewsletterBlockPreview: React.FC<NewsletterBlockPreviewProps> = ({
  title = 'Rejoindre le Cercle Privé Angaly',
  subtitle = 'INVITATIONS EXCLUSIVES',
  body = 'Recevez en avant-première les lancements de nos capsules et les invitations à nos défilés privés.',
  cta = 'S’inscrire',
}) => {
  return (
    <section
      data-testid="newsletter-block-preview"
      className="bg-angaly-navy p-8 sm:p-12 text-white text-center rounded-sm border border-angaly-royal-navy shadow-sm"
    >
      <div className="max-w-xl mx-auto space-y-4">
        {subtitle && (
          <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-angaly-champagne font-semibold">
            {subtitle}
          </p>
        )}
        <h2 className="font-heading text-2xl sm:text-3xl text-white">
          {title}
        </h2>
        {body && (
          <p className="text-xs sm:text-sm text-white/70 font-sans">
            {body}
          </p>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
          <input
            type="email"
            readOnly
            placeholder="Votre adresse email privilégiée"
            className="rounded-sm border border-angaly-border bg-white px-3.5 py-2.5 text-xs text-angaly-navy placeholder:text-angaly-warm-gray focus:outline-none flex-1"
          />
          <button
            type="button"
            className="rounded-sm bg-angaly-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-angaly-gold-light"
          >
            {cta}
          </button>
        </div>
      </div>
    </section>
  );
};
