import React from 'react';
import Image from 'next/image';

interface QuoteEditorialPreviewProps {
  quote?: string | null | undefined;
  title?: string | null | undefined;
  authorName?: string | null | undefined;
  authorRole?: string | null | undefined;
  imageUrl?: string | null | undefined;
  imageAlt?: string | null | undefined;
}

export const QuoteEditorialPreview: React.FC<QuoteEditorialPreviewProps> = ({
  quote = '« La haute couture n’est pas seulement une question de coupe ou de tissu ; c’est la rencontre intime entre l’âme d’une cliente et le dévouement d’un artisan. »',
  title,
  authorName = 'Miora R.',
  authorRole = 'Directrice de création & Fondatrice',
  imageUrl,
  imageAlt,
}) => {
  return (
    <section
      data-testid="quote-editorial-preview"
      className="bg-angaly-ivory p-6 sm:p-12 border border-angaly-border rounded-sm"
    >
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8 items-center text-left">
        {imageUrl && (
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-full border-2 border-angaly-gold shadow-sm">
            <Image
              src={imageUrl}
              alt={imageAlt ?? authorName ?? 'Portrait'}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="flex-1 space-y-3">
          {title && (
            <h3 className="font-heading text-lg sm:text-xl text-angaly-navy font-semibold">
              {title}
            </h3>
          )}
          <blockquote className="border-l-2 border-angaly-gold pl-4 font-heading text-lg sm:text-2xl italic text-angaly-navy leading-relaxed">
            {quote}
          </blockquote>
          {(authorName || authorRole) && (
            <div className="pl-4 pt-1">
              {authorName && (
                <p className="text-xs uppercase tracking-widest text-angaly-navy font-bold">
                  {authorName}
                </p>
              )}
              {authorRole && (
                <p className="text-[11px] text-angaly-slate font-medium">
                  {authorRole}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
