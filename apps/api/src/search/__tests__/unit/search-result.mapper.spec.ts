import { SearchResultMapper } from '../../infrastructure/mappers/search-result.mapper';

describe('SearchResultMapper', () => {
  it('maps a raw row to a domain entity with the given type', () => {
    const entity = SearchResultMapper.toDomain(
      { id: 'creation-1', slug: 'robe-eternelle', title: 'Robe Éternelle', excerpt: 'Une robe.', imageUrl: null },
      'CREATION',
    );

    expect(entity.type).toBe('CREATION');
    expect(entity.slug).toBe('robe-eternelle');
    expect(entity.excerpt).toBe('Une robe.');
  });

  it('defaults a null excerpt to an empty string', () => {
    const entity = SearchResultMapper.toDomain(
      { id: 'atelier-1', slug: 'antananarivo-centre', title: 'Atelier', excerpt: null, imageUrl: null },
      'ATELIER',
    );

    expect(entity.excerpt).toBe('');
  });

  it('maps a domain entity to a response DTO', () => {
    const entity = SearchResultMapper.toDomain(
      { id: 'post-1', slug: 'article', title: 'Article', excerpt: 'excerpt', imageUrl: 'http://localhost:9000/blog/a.jpg' },
      'BLOG_POST',
    );
    const dto = SearchResultMapper.toResponseDto(entity);

    expect(dto).toEqual({
      id: 'post-1',
      slug: 'article',
      title: 'Article',
      excerpt: 'excerpt',
      imageUrl: 'http://localhost:9000/blog/a.jpg',
    });
  });
});
