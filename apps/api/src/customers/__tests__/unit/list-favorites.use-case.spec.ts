import { CustomerEntity } from '../../domain/entities/customer.entity';
import type { FavoriteEntityType } from '../../domain/entities/favorite.entity';
import { FavoriteEntity } from '../../domain/entities/favorite.entity';
import { ListFavoritesUseCase } from '../../application/use-cases/list-favorites.use-case';
import type { ICustomerRepository } from '../../domain/repositories/customer.repository';
import type { IFavoriteRepository } from '../../domain/repositories/favorite.repository';
import type { ICreationRepository } from '../../../creations/domain/repositories/creation.repository';
import type { ICollectionRepository } from '../../../collections/domain/repositories/collection.repository';
import type { IProductRepository } from '../../../products/domain/repositories/product.repository';
import { CreationEntity } from '../../../creations/domain/entities/creation.entity';
import { CollectionEntity } from '../../../collections/domain/entities/collection.entity';
import { ProductEntity } from '../../../products/domain/entities/product.entity';

function sampleCustomer(): CustomerEntity {
  return CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function favorite(entityType: FavoriteEntityType, entityId: string, createdAt: Date): FavoriteEntity {
  return FavoriteEntity.create({ id: `favorite-${entityId}`, customerId: 'customer-1', entityType, entityId, createdAt });
}

function sampleCreation(): CreationEntity {
  return CreationEntity.create({
    id: 'creation-1',
    slug: 'robe-eternelle',
    name: 'Robe Éternelle',
    description: 'Une robe intemporelle.',
    materials: null,
    techniques: null,
    availability: 'PIECE_UNIQUE',
    reproducible: true,
    isFeatured: false,
    featuredFrom: null,
    featuredUntil: null,
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    collection: null,
    media: [{ id: 'media-1', url: 'http://localhost:9000/creations/a.jpg', altText: '', sortOrder: 0 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function sampleCollection(): CollectionEntity {
  return CollectionEntity.create({
    id: 'collection-1',
    slug: 'eternelle',
    name: 'Éternelle',
    description: null,
    story: null,
    seasonYear: 2026,
    publishedAt: new Date(),
    media: [{ id: 'media-2', url: 'http://localhost:9000/collections/b.jpg', altText: '', sortOrder: 0 }],
    creationsCount: 3,
    creations: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function sampleProduct(): ProductEntity {
  return ProductEntity.create({
    id: 'product-1',
    sku: 'ROB-001',
    slug: 'robe-cocktail',
    name: 'Robe Cocktail',
    description: 'Une robe de cocktail.',
    price: { amount: '150000.00', currency: 'MGA' },
    status: 'AVAILABLE',
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    media: [{ id: 'media-3', url: 'http://localhost:9000/products/c.jpg', altText: '', sortOrder: 0 }],
    variants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(overrides: {
  customer?: CustomerEntity | null;
  favorites?: FavoriteEntity[];
  creation?: CreationEntity | null;
  collection?: CollectionEntity | null;
  product?: ProductEntity | null;
}) {
  const customerRepository: ICustomerRepository = {
    findByUserId: jest.fn().mockResolvedValue(overrides.customer ?? sampleCustomer()),
    findById: jest.fn(),
    update: jest.fn(),
  };
  const favoriteRepository: IFavoriteRepository = {
    findById: jest.fn(),
    findByCustomerAndEntity: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    listByCustomer: jest.fn().mockResolvedValue(overrides.favorites ?? []),
  };
  const creationRepository: ICreationRepository = {
    findBySlug: jest.fn(),
    findById: jest.fn().mockResolvedValue(overrides.creation ?? null),
    list: jest.fn(),
  };
  const collectionRepository: ICollectionRepository = {
    findPublishedBySlug: jest.fn(),
    findById: jest.fn().mockResolvedValue(overrides.collection ?? null),
    list: jest.fn(),
  };
  const productRepository: IProductRepository = {
    findBySlug: jest.fn(),
    findById: jest.fn().mockResolvedValue(overrides.product ?? null),
    list: jest.fn(),
    listSimilar: jest.fn(),
    findVariantById: jest.fn(),
  };

  return new ListFavoritesUseCase(
    customerRepository,
    favoriteRepository,
    creationRepository,
    collectionRepository,
    productRepository,
  );
}

describe('ListFavoritesUseCase', () => {
  it('returns an empty list when no customer profile exists for the userId', async () => {
    const useCase = buildUseCase({ customer: null });

    expect(await useCase.execute('unknown-user')).toEqual([]);
  });

  it('hydrates a CREATION favorite with name/slug/imageUrl', async () => {
    const useCase = buildUseCase({
      favorites: [favorite('CREATION', 'creation-1', new Date())],
      creation: sampleCreation(),
    });

    const [result] = await useCase.execute('user-1');

    expect(result.display).toEqual({
      name: 'Robe Éternelle',
      slug: 'robe-eternelle',
      imageUrl: 'http://localhost:9000/creations/a.jpg',
    });
  });

  it('hydrates a COLLECTION favorite with name/slug/imageUrl', async () => {
    const useCase = buildUseCase({
      favorites: [favorite('COLLECTION', 'collection-1', new Date())],
      collection: sampleCollection(),
    });

    const [result] = await useCase.execute('user-1');

    expect(result.display).toEqual({
      name: 'Éternelle',
      slug: 'eternelle',
      imageUrl: 'http://localhost:9000/collections/b.jpg',
    });
  });

  it('hydrates a PRODUCT favorite with name/slug/imageUrl', async () => {
    const useCase = buildUseCase({
      favorites: [favorite('PRODUCT', 'product-1', new Date())],
      product: sampleProduct(),
    });

    const [result] = await useCase.execute('user-1');

    expect(result.display).toEqual({
      name: 'Robe Cocktail',
      slug: 'robe-cocktail',
      imageUrl: 'http://localhost:9000/products/c.jpg',
    });
  });

  it('returns a null display when the referenced entity no longer exists', async () => {
    const useCase = buildUseCase({ favorites: [favorite('CREATION', 'deleted-creation', new Date())], creation: null });

    const [result] = await useCase.execute('user-1');

    expect(result.display).toBeNull();
  });

  it('orders results by entityType (CREATION, PRODUCT, COLLECTION) then most recent first', async () => {
    const oldest = new Date('2026-01-01T00:00:00.000Z');
    const newest = new Date('2026-02-01T00:00:00.000Z');
    const useCase = buildUseCase({
      favorites: [
        favorite('COLLECTION', 'collection-1', newest),
        favorite('CREATION', 'creation-old', oldest),
        favorite('PRODUCT', 'product-1', newest),
        favorite('CREATION', 'creation-new', newest),
      ],
    });

    const results = await useCase.execute('user-1');

    expect(results.map((r) => r.favorite.entityId)).toEqual([
      'creation-new',
      'creation-old',
      'product-1',
      'collection-1',
    ]);
  });
});
