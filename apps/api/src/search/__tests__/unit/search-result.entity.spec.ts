import { SearchResultEntity } from '../../domain/entities/search-result.entity';

function baseProps() {
  return {
    type: 'CREATION' as const,
    id: 'creation-1',
    slug: 'robe-eternelle',
    title: 'Robe Éternelle',
    excerpt: 'Une robe intemporelle.',
    imageUrl: 'http://localhost:9000/creations/a.jpg',
  };
}

describe('SearchResultEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = SearchResultEntity.create(baseProps());

    expect(entity.type).toBe('CREATION');
    expect(entity.slug).toBe('robe-eternelle');
    expect(entity.imageUrl).toBe('http://localhost:9000/creations/a.jpg');
  });

  it('accepts a null imageUrl', () => {
    const entity = SearchResultEntity.create({ ...baseProps(), imageUrl: null });
    expect(entity.imageUrl).toBeNull();
  });

  it('rejects an empty slug', () => {
    expect(() => SearchResultEntity.create({ ...baseProps(), slug: '  ' })).toThrow(
      'SearchResult.slug must not be empty',
    );
  });

  it('rejects an empty title', () => {
    expect(() => SearchResultEntity.create({ ...baseProps(), title: '' })).toThrow(
      'SearchResult.title must not be empty',
    );
  });
});
