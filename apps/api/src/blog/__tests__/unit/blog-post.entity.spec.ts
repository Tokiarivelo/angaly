import type { BlogPostProps } from '../../domain/entities/blog-post.entity';
import { BlogPostEntity } from '../../domain/entities/blog-post.entity';

function baseProps(): BlogPostProps {
  return {
    id: 'post-1',
    slug: 'choisir-sa-robe-de-mariee',
    title: 'Choisir sa robe de mariée',
    excerpt: 'Nos conseils pour trouver la robe parfaite.',
    content: '<p>Contenu complet de l’article…</p>',
    publishedAt: new Date('2020-01-01T00:00:00.000Z'),
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'redaction@angaly.mg' },
    media: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

describe('BlogPostEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = BlogPostEntity.create(baseProps());

    expect(entity.id).toBe('post-1');
    expect(entity.title).toBe('Choisir sa robe de mariée');
    expect(entity.author.email).toBe('redaction@angaly.mg');
    expect(entity.content).toContain('Contenu complet');
  });

  it('accepts a null content (summary rows)', () => {
    const entity = BlogPostEntity.create({ ...baseProps(), content: null });
    expect(entity.content).toBeNull();
  });

  it('rejects an empty slug', () => {
    expect(() => BlogPostEntity.create({ ...baseProps(), slug: '  ' })).toThrow(
      'BlogPost.slug must not be empty',
    );
  });

  it('rejects an empty title', () => {
    expect(() => BlogPostEntity.create({ ...baseProps(), title: '' })).toThrow(
      'BlogPost.title must not be empty',
    );
  });

  describe('isPublished', () => {
    it('is true when publishedAt is in the past', () => {
      const entity = BlogPostEntity.create({ ...baseProps(), publishedAt: new Date(Date.now() - 1000) });
      expect(entity.isPublished).toBe(true);
    });

    it('is false when publishedAt is null', () => {
      const entity = BlogPostEntity.create({ ...baseProps(), publishedAt: null });
      expect(entity.isPublished).toBe(false);
    });

    it('is false when publishedAt is in the future', () => {
      const entity = BlogPostEntity.create({ ...baseProps(), publishedAt: new Date(Date.now() + 100_000) });
      expect(entity.isPublished).toBe(false);
    });
  });
});
