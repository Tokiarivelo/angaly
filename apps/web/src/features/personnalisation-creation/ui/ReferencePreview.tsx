import React from 'react';
import Image from 'next/image';
import type { CreationDto } from '@angaly/types';

interface ReferencePreviewProps {
  creation: CreationDto;
}

export const ReferencePreview: React.FC<ReferencePreviewProps> = ({ creation }) => {
  const mainImage = creation.media?.[0]?.url;

  return (
    <div className="sticky top-24">
      {mainImage ? (
        <div className="relative w-full aspect-[3/4] bg-ivory rounded-lg overflow-hidden border border-border">
          <Image
            src={mainImage}
            alt={creation.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ) : (
        <div className="w-full aspect-[3/4] bg-slate/10 rounded-lg flex items-center justify-center">
          <span className="text-slate text-sm">Image non disponible</span>
        </div>
      )}
      <p className="text-slate italic text-sm mt-4 text-center px-4">
        Aperçu indicatif — les rendus définitifs seront validés avec votre couturière.
      </p>
    </div>
  );
};
