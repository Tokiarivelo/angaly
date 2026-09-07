import type { CollectionDto, CreationDto } from '@angaly/types';

import type { ContentType, LaUneItem } from '../types/la-une-item.types';

function deriveContentType(creation: CreationDto): ContentType | null {
  const categoryName = creation.category.name.toLowerCase();
  if (categoryName.includes('mariée') || categoryName.includes('mariage')) return 'mariage';
  if (categoryName.includes('costume')) return 'costume';
  if (creation.collection) return 'collection';
  return null;
}

function creationToItem(creation: CreationDto, contentType: ContentType | null): LaUneItem {
  return {
    id: creation.id,
    slug: creation.slug,
    title: creation.name,
    description: creation.description,
    imageUrl: creation.media[0]?.url ?? null,
    contentType,
    date: creation.featuredFrom,
    href: `/creations/${creation.slug}`,
  };
}

function collectionToHeroItem(collection: CollectionDto): LaUneItem {
  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.name,
    description: collection.description ?? collection.story ?? '',
    imageUrl: collection.media[0]?.url ?? null,
    contentType: 'collection-du-moment',
    date: collection.publishedAt,
    href: `/collections/${collection.slug}`,
  };
}

/**
 * Hero = the featured collection when one is published, else the most
 * recently featured creation (tagged "Création du mois") — see
 * docs/pages/la-une.md "Points d'attention" for why this is derived rather
 * than backed by a dedicated editorial-taxonomy field.
 */
export function buildLaUneItems(creations: CreationDto[], featuredCollection: CollectionDto | null): LaUneItem[] {
  const creationItems = creations.map((creation, index) =>
    creationToItem(
      creation,
      index === 0 && !featuredCollection ? 'creation-du-mois' : deriveContentType(creation),
    ),
  );

  return featuredCollection ? [collectionToHeroItem(featuredCollection), ...creationItems] : creationItems;
}
