import type { AtelierDto } from '@angaly/types';

import { AtelierListCard } from './AtelierListCard';

export function AteliersList({
  ateliers,
  flagshipSlug,
  activeSlug,
  onHoverChange,
}: {
  ateliers: AtelierDto[];
  flagshipSlug: string;
  activeSlug: string | null;
  onHoverChange: (slug: string | null) => void;
}) {
  return (
    <div className="flex h-[700px] w-full flex-col gap-8 overflow-y-auto pr-2 [scrollbar-width:none] lg:w-1/2 [&::-webkit-scrollbar]:hidden">
      {ateliers.map((atelier) => (
        <AtelierListCard
          key={atelier.id}
          atelier={atelier}
          isFlagship={atelier.slug === flagshipSlug}
          isActive={activeSlug === atelier.slug}
          onHoverChange={onHoverChange}
        />
      ))}
    </div>
  );
}
