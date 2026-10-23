import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TrimsEditor } from '../ui/steps/TrimsEditor';
import { applyFitChange, buildFitRows, suggestedFitFrom } from '../utils/fit-parameters';
import { defaultTrim, findTrim, toggleTrim, trimsAvailableFor, updateTrim } from '../utils/trims';

describe('TrimsEditor', () => {
  it('is hidden for garments without a bodice to trim (trousers, skirts)', () => {
    const { container } = render(<TrimsEditor garmentType="PANTALON" value={undefined} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(trimsAvailableFor('JUPE')).toBe(false);
  });

  it('switches a lace berthe on with its defaults, and shows the suggestion badge', () => {
    const onChange = vi.fn();
    render(
      <TrimsEditor
        garmentType="ROBE_MARIEE"
        value={undefined}
        suggested={{ items: [{ kind: 'BEADING', place: 'ENCOLURE', beadMm: 6, rows: 1 }] }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Suggéré par l’IA — modifiable')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Berthe (bande le long du décolleté)'));
    expect(onChange).toHaveBeenCalledWith({
      items: [{ kind: 'BEADING', place: 'ENCOLURE', beadMm: 6, rows: 1 }, defaultTrim('BERTHE')],
    });
  });

  it('tunes an enabled garniture: point, frill tiers, material, colour, and resets', () => {
    const onChange = vi.fn();
    const value = { items: [defaultTrim('BERTHE'), defaultTrim('SLEEVE_FRILL'), { kind: 'BEADING' as const, place: 'MANCHES' as const, beadMm: 4, rows: 1, color: '#ffffff' }] };
    render(<TrimsEditor garmentType="ROBE" value={value} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Pointe au milieu devant'), { target: { value: '140' } });
    expect(findTrim(onChange.mock.calls.at(-1)![0], 'BERTHE')).toMatchObject({ pointMm: 140 });
    fireEvent.change(screen.getByLabelText('Nombre de volants'), { target: { value: '3' } });
    expect(findTrim(onChange.mock.calls.at(-1)![0], 'SLEEVE_FRILL')).toMatchObject({ tiers: 3 });
    fireEvent.change(screen.getAllByLabelText('Matière')[0]!, { target: { value: 'TULLE' } });
    expect(findTrim(onChange.mock.calls.at(-1)![0], 'BERTHE')).toMatchObject({ material: 'TULLE' });
    fireEvent.change(screen.getAllByLabelText('Couleur')[0]!, { target: { value: '#ecdcb6' } });
    expect(findTrim(onChange.mock.calls.at(-1)![0], 'BERTHE')).toMatchObject({ color: '#ecdcb6' });
    fireEvent.click(screen.getByText('Par défaut'));
    expect(findTrim(onChange.mock.calls.at(-1)![0], 'BEADING:MANCHES')).not.toHaveProperty('color');
    fireEvent.change(screen.getByLabelText('Diamètre des perles'), { target: { value: '8' } });
    expect(findTrim(onChange.mock.calls.at(-1)![0], 'BEADING:MANCHES')).toMatchObject({ beadMm: 8 });
    fireEvent.click(screen.getByText('Réinitialiser'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

describe('trims helpers and fit parameters', () => {
  it('toggles off, ignores invalid values, and keeps trims when another adjustment changes', () => {
    const on = toggleTrim(undefined, 'BEADING:TAILLE');
    expect(toggleTrim(on, 'BEADING:TAILLE')).toEqual({ items: [] });
    expect(updateTrim(on, 'BEADING:TAILLE', { beadMm: 999 })).toEqual(on);
    const ext = applyFitChange({ trims: on }, { field: 'ease', value: 'AJUSTE' });
    expect(ext.trims).toEqual(on);
    expect(applyFitChange(ext, { field: 'trims', value: null }).trims).toBeUndefined();
    expect(applyFitChange(ext, { field: 'trims', value: { items: [] } }).trims).toEqual({ items: [] });
  });

  it('reads the photo garnitures as a suggestion and lists them on the garment sheet', () => {
    const profile = {
      isGarment: true,
      garmentType: 'ROBE_MARIEE',
      occasion: null,
      style: null,
      cutType: null,
      details: {},
      trims: [{ kind: 'BERTHE' as const, depthMm: 110, pointMm: 140, material: 'DENTELLE' as const }, { kind: 'BEADING' as const, place: 'ENCOLURE' as const, beadMm: 6, rows: 1 }],
    };
    expect(suggestedFitFrom(profile)?.trims?.items).toHaveLength(2);
    expect(buildFitRows(profile).find((r) => r.label === 'Garnitures suggérées')?.value).toBe(
      'Berthe (bande le long du décolleté), Rang de perles (Bord du décolleté)',
    );
  });
});
