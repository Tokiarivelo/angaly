import React from 'react';
import Image from 'next/image';

interface EditorialSplitPreviewProps {
  eyebrow?: string | null | undefined;
  title?: string | null | undefined;
  body?: string | null | undefined;
  imageUrl?: string | null | undefined;
  imageAlt?: string | null | undefined;
  primaryCta?: string | null | undefined;
  imagePosition?: 'left' | 'right';
  isCompact?: boolean;
}

export const EditorialSplitPreview: React.FC<EditorialSplitPreviewProps> = ({
  eyebrow = 'NOTRE SAVOIR-FAIRE',
  title = 'Une maison de couture pensée pour vous.',
  body = "Fondée au cœur de Madagascar, la Maison Angaly perpétue l'artisanat d'exception. Chaque création est le fruit d'une rencontre entre une vision, des matières nobles et le talent de nos artisans.",
  imageUrl,
  imageAlt,
  primaryCta = 'Découvrir la Maison',
  imagePosition = 'left',
  isCompact = false,
}) => {
  const displayImage = imageUrl || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80&fm=jpg';

  const imageBlock = (
    <div className={`relative overflow-hidden rounded-xs bg-angaly-ivory ${isCompact ? 'aspect-[4/3] w-full' : 'aspect-[3/4] w-full max-w-md mx-auto'}`}>
      <Image
        src={displayImage}
        alt={imageAlt ?? title ?? 'Savoir-faire Angaly'}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
      {/* Haute Couture Double Inner Border Frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 sm:inset-4 border border-angaly-ivory/50"
      />
    </div>
  );

  const textBlock = (
    <div className="flex flex-col justify-center text-left space-y-4">
      {eyebrow && (
        <p className="text-[10px] sm:text-xs tracking-[0.3em] text-angaly-navy uppercase font-semibold">
          {eyebrow}
        </p>
      )}
      <h2 className="font-heading text-2xl sm:text-4xl text-angaly-navy leading-tight">
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-angaly-slate leading-relaxed font-sans">
        {body}
      </p>
      {primaryCta && (
        <div className="pt-2">
          <span className="inline-flex items-center justify-center rounded-sm border border-angaly-navy bg-angaly-navy px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-angaly-navy-blue">
            {primaryCta}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <section
      data-testid="editorial-split-preview"
      className="bg-angaly-warm-ivory/60 p-6 sm:p-10 border border-angaly-border rounded-sm"
    >
      <div className={`grid gap-8 sm:gap-12 items-center ${isCompact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {imagePosition === 'left' ? (
          <>
            {imageBlock}
            {textBlock}
          </>
        ) : (
          <>
            {textBlock}
            {imageBlock}
          </>
        )}
      </div>
    </section>
  );
};
