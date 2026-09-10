'use client';

import * as Tabs from '@radix-ui/react-tabs';
import type { ProductDto } from '@angaly/types';

interface ProductDetailsTabsProps {
  product: ProductDto;
}

/**
 * Radix Tabs (keyboard-accessible by default — arrow keys move focus,
 * Enter/Space activates) per the page's explicit acceptance criterion. Only
 * "Description" has real backing content on the real Stitch screen; the two
 * other tabs render the closest real data available (material, and a
 * static shipping/returns policy — no dedicated Prisma field for either,
 * see docs/pages/fiche-produit.md "Points d'attention").
 */
export function ProductDetailsTabs({ product }: ProductDetailsTabsProps) {
  const material = product.variants.find((variant) => variant.material)?.material;

  return (
    <Tabs.Root defaultValue="description" className="mx-auto max-w-4xl border-t border-angaly-border pt-12">
      <Tabs.List className="mb-12 flex justify-center gap-12 border-b border-angaly-border">
        <Tabs.Trigger
          value="description"
          className="pb-4 font-heading text-xl tracking-wider text-angaly-slate uppercase transition-colors hover:text-angaly-navy data-[state=active]:border-b data-[state=active]:border-angaly-navy data-[state=active]:text-angaly-navy"
        >
          Description
        </Tabs.Trigger>
        <Tabs.Trigger
          value="materiel"
          className="pb-4 font-heading text-xl tracking-wider text-angaly-slate uppercase transition-colors hover:text-angaly-navy data-[state=active]:border-b data-[state=active]:border-angaly-navy data-[state=active]:text-angaly-navy"
        >
          Matière &amp; entretien
        </Tabs.Trigger>
        <Tabs.Trigger
          value="livraison"
          className="pb-4 font-heading text-xl tracking-wider text-angaly-slate uppercase transition-colors hover:text-angaly-navy data-[state=active]:border-b data-[state=active]:border-angaly-navy data-[state=active]:text-angaly-navy"
        >
          Livraison &amp; retours
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="description" className="px-4 text-center font-heading text-lg leading-relaxed text-angaly-slate md:px-12">
        <p>{product.description}</p>
      </Tabs.Content>

      <Tabs.Content value="materiel" className="px-4 text-center font-heading text-lg leading-relaxed text-angaly-slate md:px-12">
        <p>{material ? `Matière : ${material}` : "Composition détaillée disponible en boutique ou sur demande auprès de l'atelier."}</p>
        <p className="mt-6">Entretien recommandé : nettoyage à sec exclusivement, à conserver à l'abri de la lumière directe.</p>
      </Tabs.Content>

      <Tabs.Content value="livraison" className="px-4 text-center font-heading text-lg leading-relaxed text-angaly-slate md:px-12">
        <p>Livraison sous 5 à 10 jours ouvrés à Madagascar. Retours acceptés sous 14 jours, article non porté et étiquettes intactes.</p>
      </Tabs.Content>
    </Tabs.Root>
  );
}
