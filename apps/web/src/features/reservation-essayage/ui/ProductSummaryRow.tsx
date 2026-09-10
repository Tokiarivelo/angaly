import { Check } from 'lucide-react';
import Image from 'next/image';
import type { ProductDto } from '@angaly/types';

import { formatPriceAriary } from '@/lib/utils';

const EXCLUSIVE_SERVICES = ['Essayage privé de 45 minutes', 'Conseil morphologique', 'Possibilité de retouches sur mesure'];

interface ProductSummaryRowProps {
  product: ProductDto | null;
  isLoading: boolean;
}

/** Product card + "Service Exclusif" list — left column, verified on the real Stitch screen. */
export function ProductSummaryRow({ product, isLoading }: ProductSummaryRowProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-sm text-angaly-slate">
        Chargement du produit…
      </p>
    );
  }

  if (!product) {
    return null;
  }

  const media = product.media[0];

  return (
    <div className="space-y-8">
      <div className="flex gap-4 border border-angaly-border p-4">
        {media && (
          <div className="relative h-24 w-20 shrink-0">
            <Image src={media.url} alt={media.altText} fill sizes="80px" className="object-cover" />
          </div>
        )}
        <div>
          <h3 className="font-heading text-lg text-angaly-navy">{product.name}</h3>
          <p className="text-sm text-angaly-slate">Réf: {product.sku}</p>
          <p className="mt-1 text-angaly-navy">{formatPriceAriary(Number(product.price.amount))}</p>
        </div>
      </div>

      <div>
        <span className="text-xs tracking-widest text-angaly-slate uppercase">Service Exclusif</span>
        <ul className="mt-3 space-y-2">
          {EXCLUSIVE_SERVICES.map((service) => (
            <li key={service} className="flex items-center gap-2 text-sm text-angaly-navy">
              <Check className="h-4 w-4 text-angaly-gold" aria-hidden="true" />
              {service}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
