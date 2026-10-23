import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DetailsStep } from '../ui/steps/DetailsStep';

describe('DetailsStep', () => {
  it('shows a sketch with each option and selects on click', () => {
    const onSelect = vi.fn();
    const { container } = render(<DetailsStep selectedDetails={{ manches: 'BALLON' }} onSelectDetail={onSelect} />);
    const ballon = screen.getByRole('button', { name: 'Manches ballon' });
    expect(ballon).toHaveAttribute('aria-pressed', 'true');
    expect(ballon.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('button svg').length).toBe(container.querySelectorAll('button').length);
    fireEvent.click(screen.getByRole('button', { name: 'Col officier / Mao' }));
    expect(onSelect).toHaveBeenCalledWith('col', 'OFFICIER');
  });

  it('draws the back options from the back', () => {
    render(<DetailsStep selectedDetails={{}} onSelectDetail={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Dos nu plongeant' }).querySelector('svg')).toHaveAttribute('data-view', 'back');
  });
});

describe('DetailsStep for another garment', () => {
  it('offers trousers their own lengths, drawn as trousers, and shows the hovered option in large', () => {
    const onSelect = vi.fn();
    render(<DetailsStep selectedDetails={{ col: 'CHALE' }} onSelectDetail={onSelect} garmentType="PANTALON" cutType="EVASEE" />);
    expect(screen.queryByRole('button', { name: 'Manches ballon' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Col châle / revers' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Longueur de jambe' })).toBeInTheDocument();
    expect(screen.getByText(/La forme de la jambe se règle à l’étape « Coupe »/)).toBeInTheDocument();
    const bermuda = screen.getByRole('button', { name: 'Bermuda' });
    fireEvent.mouseEnter(bermuda);
    expect(screen.getByRole('img', { name: 'Aperçu : Bermuda' })).toBeInTheDocument();
    expect(screen.getByText('Jambe arrêtée juste au-dessus du genou.')).toBeInTheDocument();
    fireEvent.mouseLeave(bermuda);
    expect(screen.queryByRole('img', { name: /Aperçu/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pantacourt' }));
    expect(onSelect).toHaveBeenCalledWith('longueur', 'MIDI');
  });

  it('shows the chosen option in large with its description', () => {
    render(<DetailsStep selectedDetails={{ manches: 'LANTERNE' }} onSelectDetail={() => undefined} garmentType="CHEMISE" />);
    expect(screen.getByRole('img', { name: 'Aperçu : Manches lanterne' })).toBeInTheDocument();
    expect(screen.getByText('Manche bouffante froncée en haut et en bas, renflée au milieu.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dos' })).toBeNull();
  });
});

describe('DetailsStep drawings follow the choices made', () => {
  it('redraws the other groups once a short is chosen (no long trousers on the pocket options)', () => {
    const pocketDrawing = (details: Record<string, string>): string => {
      const { unmount } = render(<DetailsStep selectedDetails={details} onSelectDetail={() => undefined} garmentType="PANTALON" cutType="DROITE" />);
      const svg = screen.getByRole('button', { name: 'Poches plaquées' }).querySelector('svg')!.innerHTML;
      unmount();
      return svg;
    };
    expect(pocketDrawing({ longueur: 'MINI' })).not.toBe(pocketDrawing({ longueur: 'SOL' }));
  });
});
