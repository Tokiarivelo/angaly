import type { CategoryProps } from '../../domain/entities/category.entity';
import { CategoryEntity } from '../../domain/entities/category.entity';

function baseProps(): CategoryProps {
  return { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée', kind: 'CREATION' };
}

describe('CategoryEntity', () => {
  it('creates a valid entity and exposes its properties via getters', () => {
    const entity = CategoryEntity.create(baseProps());

    expect(entity.id).toBe('cat-1');
    expect(entity.slug).toBe('robes-de-mariee');
    expect(entity.name).toBe('Robes de mariée');
    expect(entity.kind).toBe('CREATION');
  });

  it('rejects an empty slug', () => {
    expect(() => CategoryEntity.create({ ...baseProps(), slug: '  ' })).toThrow(
      'Category.slug must not be empty',
    );
  });

  it('rejects an empty name', () => {
    expect(() => CategoryEntity.create({ ...baseProps(), name: '' })).toThrow(
      'Category.name must not be empty',
    );
  });
});
