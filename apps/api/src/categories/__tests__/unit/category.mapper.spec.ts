import { CategoryMapper } from '../../infrastructure/mappers/category.mapper';
import type { CategoryRecord } from '../../infrastructure/repositories/prisma-category.repository';

function categoryRecord(overrides: Partial<CategoryRecord> = {}): CategoryRecord {
  return { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée', kind: 'CREATION', ...overrides };
}

describe('CategoryMapper', () => {
  it('maps a Prisma record to a domain entity', () => {
    const entity = CategoryMapper.toDomain(categoryRecord());

    expect(entity.id).toBe('cat-1');
    expect(entity.slug).toBe('robes-de-mariee');
    expect(entity.kind).toBe('CREATION');
  });

  it('maps a domain entity to a response DTO', () => {
    const entity = CategoryMapper.toDomain(categoryRecord({ kind: 'BLOG' }));
    const dto = CategoryMapper.toResponseDto(entity);

    expect(dto).toEqual({ id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée', kind: 'BLOG' });
  });
});
