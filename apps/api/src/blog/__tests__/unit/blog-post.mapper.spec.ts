import { BlogPostMapper } from '../../infrastructure/mappers/blog-post.mapper';
import type {
  BlogPostDetailRecord,
  BlogPostSummaryRecord,
} from '../../infrastructure/repositories/prisma-blog-post.repository';

function summaryRecord(overrides: Partial<BlogPostSummaryRecord> = {}): BlogPostSummaryRecord {
  return {
    id: 'post-1',
    slug: 'choisir-sa-robe-de-mariee',
    title: 'Choisir sa robe de mariée',
    excerpt: 'Nos conseils.',
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'redaction@angaly.mg' },
    media: [{ id: 'media-1', url: 'http://localhost:9000/blog/a.jpg', altText: null, sortOrder: 0 }],
    ...overrides,
  };
}

function detailRecord(): BlogPostDetailRecord {
  return { ...summaryRecord(), content: '<p>Contenu complet</p>' };
}

describe('BlogPostMapper', () => {
  it('toDomainSummary() leaves content null', () => {
    const entity = BlogPostMapper.toDomainSummary(summaryRecord());

    expect(entity.content).toBeNull();
    expect(entity.media[0]?.altText).toBe('');
  });

  it('toDomainDetail() populates the full content', () => {
    const entity = BlogPostMapper.toDomainDetail(detailRecord());
    expect(entity.content).toBe('<p>Contenu complet</p>');
  });

  it('toResponseDto() never exposes a content field', () => {
    const entity = BlogPostMapper.toDomainSummary(summaryRecord());
    const dto = BlogPostMapper.toResponseDto(entity);

    expect(dto).not.toHaveProperty('content');
    expect(dto.author).toEqual({ id: 'user-1', email: 'redaction@angaly.mg' });
    expect(dto.publishedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('toDetailResponseDto() includes the full content', () => {
    const entity = BlogPostMapper.toDomainDetail(detailRecord());
    const dto = BlogPostMapper.toDetailResponseDto(entity);

    expect(dto.content).toBe('<p>Contenu complet</p>');
  });

  it('toResponseDto() maps a null publishedAt to null (unpublished/draft post)', () => {
    const entity = BlogPostMapper.toDomainSummary(summaryRecord({ publishedAt: null }));
    const dto = BlogPostMapper.toResponseDto(entity);

    expect(dto.publishedAt).toBeNull();
  });

  it('toDetailResponseDto() defaults content to an empty string when the entity has none loaded', () => {
    const entity = BlogPostMapper.toDomainSummary(summaryRecord());
    const dto = BlogPostMapper.toDetailResponseDto(entity);

    expect(dto.content).toBe('');
  });
});
