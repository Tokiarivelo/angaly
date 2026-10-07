import React from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

interface HeroCinematicPreviewProps {
  eyebrow?: string | null | undefined;
  title?: string | null | undefined;
  subtitle?: string | null | undefined;
  body?: string | null | undefined;
  imageUrl?: string | null | undefined;
  imageAlt?: string | null | undefined;
  primaryCta?: string | null | undefined;
  secondaryCta?: string | null | undefined;
  isCompact?: boolean;
}

export const HeroCinematicPreview: React.FC<HeroCinematicPreviewProps> = ({
  eyebrow = 'MAISON DE COUTURE — MADAGASCAR',
  title = 'ANGALY',
  subtitle = "L'élégance, créée pour vous.",
  body,
  imageUrl,
  imageAlt,
  primaryCta = 'Prendre rendez-vous',
  secondaryCta = 'Découvrir nos créations',
  isCompact = false,
}) => {
  const displayImage = imageUrl || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=1600&q=80&fm=jpg';

  return (
    <div
      data-testid="hero-cinematic-preview"
      className={`relative flex overflow-hidden bg-angaly-navy-dark items-end rounded-sm shadow-inner transition-all ${
        isCompact ? 'min-h-[380px] p-6' : 'min-h-[500px] sm:min-h-[560px] p-8 sm:p-12'
      }`}
    >
      {/* Background Photography with Luxury Gradients */}
      <div className="absolute inset-0 z-0">
        <Image
          src={displayImage}
          alt={imageAlt ?? title ?? 'Hero image'}
          fill
          sizes="100vw"
          className="object-cover opacity-65"
          priority
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-angaly-navy via-angaly-navy/45 to-transparent"
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-0 h-1/2 bg-gradient-to-t from-angaly-navy/90 to-transparent"
      />

      {/* Cinematic Content Layer */}
      <div className="relative z-10 w-full max-w-4xl text-left">
        {eyebrow && (
          <p className="text-[10px] sm:text-xs tracking-[0.3em] text-white/80 uppercase font-medium">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading mt-2 text-4xl sm:text-6xl md:text-7xl text-white font-normal leading-[1.05] tracking-wide">
          <p className="inline m-0 font-inherit text-inherit">{title || 'ANGALY'}</p>
        </h1>
        {subtitle && (
          <p className="font-heading mt-2 text-lg sm:text-2xl text-angaly-champagne italic">
            {subtitle}
          </p>
        )}
        {body && (
          <p className="mt-3 max-w-xl text-xs sm:text-sm text-white/75 leading-relaxed font-sans">
            {body}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {primaryCta && (
            <span className="inline-flex items-center justify-center rounded-sm border border-white bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-angaly-navy shadow-sm transition-colors hover:bg-angaly-warm-ivory">
              {primaryCta}
            </span>
          )}
          {secondaryCta && (
            <span className="inline-flex items-center justify-center rounded-sm border border-white/80 bg-transparent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-white hover:text-angaly-navy">
              {secondaryCta}
            </span>
          )}
        </div>
      </div>

      <ChevronDown
        aria-hidden="true"
        className="absolute bottom-4 left-1/2 z-10 h-5 w-5 -translate-x-1/2 animate-bounce text-white/70"
      />
    </div>
  );
};
