import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CONSTRUCTION_KINDS } from '@angaly/types';
import { ConstructionEditor } from '../ui/steps/ConstructionEditor';
import { applyFitChange, buildFitRows, suggestedFitFrom } from '../utils/fit-parameters';
import {
  CONSTRUCTION_FIELDS,
  CONSTRUCTION_GROUPS,
  DEFAULT_CONSTRUCTION,
  constructionAvailableFor,
  findConstruction,
  toggleConstruction,
  updateConstruction,
} from '../utils/construction';
import { validatePatternExtParameters } from '@angaly/types';

describe('construction utils', () => {
  it('every kind is in one group, has controls, and valid defaults', () => {
    const grouped = CONSTRUCTION_GROUPS.flatMap((g) => g.kinds);
    expect([...grouped].sort()).toEqual([...CONSTRUCTION_KINDS].sort());
    for (const k of CONSTRUCTION_KINDS) {
      expect(CONSTRUCTION_FIELDS[k]).toBeDefined();
      expect(validatePatternExtParameters({ construction: { items: [DEFAULT_CONSTRUCTION[k]] } }).issues).toEqual([]);
    }
  });

  it('toggles, updates within bounds, refuses out-of-range values', () => {
    const on = toggleConstruction(undefined, 'GODETS');
    expect(findConstruction(on, 'GODETS')).toEqual(DEFAULT_CONSTRUCTION.GODETS);
    expect(findConstruction(updateConstruction(on, 'GODETS', { count: 8 }), 'GODETS')).toMatchObject({ count: 8 });
    expect(updateConstruction(on, 'GODETS', { count: 99 })).toBe(on);
    expect(toggleConstruction(on, 'GODETS')).toEqual({ items: [] });
    expect(constructionAvailableFor('PANTALON')).toBe(false);
    expect(constructionAvailableFor('robe')).toBe(true);
  });

  it('the wizard keeps the construction list through other changes, and lists the photo’s suggestion', () => {
    const ext = applyFitChange(undefined, { field: 'construction', value: { items: [DEFAULT_CONSTRUCTION.LINING] } });
    expect(applyFitChange(ext, { field: 'ease', value: 'AMPLE' }).construction).toEqual({ items: [DEFAULT_CONSTRUCTION.LINING] });
    expect(applyFitChange(ext, { field: 'construction', value: null }).construction).toBeUndefined();
    const profile = { isGarment: true, garmentType: 'ROBE', occasion: null, style: null, cutType: null, details: {}, construction: [DEFAULT_CONSTRUCTION.JABOT] };
    expect(suggestedFitFrom(profile)?.construction).toEqual({ items: [DEFAULT_CONSTRUCTION.JABOT] });
    expect(buildFitRows(profile).find((r) => r.label === 'Pièces de construction suggérées')?.value).toBe('Jabot');
  });
});

describe('ConstructionEditor', () => {
  it('is hidden for trousers', () => {
    const { container } = render(<ConstructionEditor garmentType="PANTALON" value={undefined} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('switches a piece on from the photo suggestion and shows the badge', () => {
    const onChange = vi.fn();
    render(<ConstructionEditor garmentType="ROBE" value={undefined} suggested={{ items: [DEFAULT_CONSTRUCTION.CAPELET] }} onChange={onChange} />);
    expect(screen.getByText('Suggéré par l’IA — modifiable')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Doublure'));
    expect(onChange).toHaveBeenCalledWith({ items: [DEFAULT_CONSTRUCTION.CAPELET, DEFAULT_CONSTRUCTION.LINING] });
  });

  it('tunes an enabled piece: range, choice, material, colour, reset', () => {
    const onChange = vi.fn();
    const value = { items: [DEFAULT_CONSTRUCTION.HEM_FLOUNCE, DEFAULT_CONSTRUCTION.EMBROIDERY] };
    render(<ConstructionEditor garmentType="ROBE_MARIEE" value={value} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Nombre d’étages'), { target: { value: '3' } });
    expect(findConstruction(onChange.mock.calls.at(-1)![0], 'HEM_FLOUNCE')).toMatchObject({ tiers: 3 });
    fireEvent.change(screen.getByLabelText('Coupe'), { target: { value: 'CIRCULAIRE' } });
    expect(findConstruction(onChange.mock.calls.at(-1)![0], 'HEM_FLOUNCE')).toMatchObject({ style: 'CIRCULAIRE' });
    fireEvent.change(screen.getByLabelText('Matière'), { target: { value: 'DENTELLE' } });
    expect(findConstruction(onChange.mock.calls.at(-1)![0], 'HEM_FLOUNCE')).toMatchObject({ material: 'DENTELLE' });
    fireEvent.change(screen.getAllByLabelText('Couleur')[1]!, { target: { value: '#aa2233' } });
    expect(findConstruction(onChange.mock.calls.at(-1)![0], 'EMBROIDERY')).toMatchObject({ color: '#aa2233' });
    fireEvent.click(screen.getByText('Réinitialiser'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
