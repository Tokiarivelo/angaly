import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PreviewModeTabs } from '../ui/PreviewModeTabs';
import { ComparisonLayout } from '../ui/ComparisonLayout';
import { InspirationPanel } from '../ui/InspirationPanel';

describe('PreviewModeTabs', () => {
  it('offers the four views including the studio', async () => {
    const onChange = vi.fn();
    render(<PreviewModeTabs mode="piece" onChange={onChange} />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Pièce (2D)',
      'Ensemble',
      '3D sur mannequin',
      'Atelier de retouche',
    ]);
    await userEvent.click(screen.getByRole('tab', { name: 'Atelier de retouche' }));
    expect(onChange).toHaveBeenCalledWith('studio');
    expect(screen.queryByTestId('compare-controls')).not.toBeInTheDocument();
  });

  it('shows the inspiration thumbnail beside the tabs and toggles the comparison', async () => {
    const onCompare = vi.fn();
    const { rerender } = render(
      <PreviewModeTabs mode="piece" onChange={vi.fn()} inspirationUrl="https://cdn/x.jpg" compare="none" onCompareChange={onCompare} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le modèle d’inspiration' }));
    expect(onCompare).toHaveBeenCalledWith('inspiration');
    await userEvent.click(screen.getByRole('radio', { name: '3D' }));
    expect(onCompare).toHaveBeenCalledWith('3d');

    rerender(
      <PreviewModeTabs mode="piece" onChange={vi.fn()} inspirationUrl="https://cdn/x.jpg" compare="inspiration" onCompareChange={onCompare} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le modèle d’inspiration' }));
    expect(onCompare).toHaveBeenLastCalledWith('none');
  });

  it('disables comparisons that make no sense', () => {
    render(<PreviewModeTabs mode="3d" onChange={vi.fn()} inspirationUrl={null} onCompareChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Modèle' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: '3D' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Afficher le modèle d’inspiration' })).not.toBeInTheDocument();
  });

  it('offers an overlay with an opacity slider when comparing the photo with the 3D view', async () => {
    const onOverlay = vi.fn();
    const onOpacity = vi.fn();
    const { rerender } = render(
      <PreviewModeTabs
        mode="3d"
        onChange={vi.fn()}
        inspirationUrl="https://cdn/x.jpg"
        compare="inspiration"
        onCompareChange={vi.fn()}
        overlay={false}
        onOverlayChange={onOverlay}
        overlayOpacity={0.5}
        onOverlayOpacityChange={onOpacity}
      />,
    );
    expect(screen.queryByLabelText('Opacité du modèle')).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Superposer'));
    expect(onOverlay).toHaveBeenCalledWith(true);

    rerender(
      <PreviewModeTabs
        mode="3d"
        onChange={vi.fn()}
        inspirationUrl="https://cdn/x.jpg"
        compare="inspiration"
        onCompareChange={vi.fn()}
        overlay
        onOverlayChange={onOverlay}
        overlayOpacity={0.5}
        onOverlayOpacityChange={onOpacity}
      />,
    );
    expect(screen.getByLabelText('Opacité du modèle')).toBeInTheDocument();
  });

  it('does not offer the overlay outside the 3D view', () => {
    render(
      <PreviewModeTabs mode="piece" onChange={vi.fn()} inspirationUrl="u" compare="inspiration" onCompareChange={vi.fn()} onOverlayChange={vi.fn()} />,
    );
    expect(screen.queryByLabelText('Superposer')).not.toBeInTheDocument();
  });
});

describe('ComparisonLayout', () => {
  it('renders only the primary view without a comparison', () => {
    render(<ComparisonLayout primary={<div>A</div>} secondary={null} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.queryByTestId('comparison-split')).not.toBeInTheDocument();
  });

  it('splits into two panes', () => {
    render(<ComparisonLayout primary={<div>A</div>} secondary={<div>B</div>} />);
    expect(screen.getByTestId('comparison-split')).toHaveTextContent('AB');
  });

  it('lays the photo over the primary view at the requested opacity', () => {
    render(<ComparisonLayout primary={<div>A</div>} secondary={<div>B</div>} overlay={{ url: 'https://cdn/x.jpg', opacity: 0.4 }} />);
    expect(screen.getByTestId('comparison-overlay-image')).toHaveStyle({ opacity: '0.4' });
    expect(screen.queryByText('B')).not.toBeInTheDocument();
  });
});

describe('InspirationPanel', () => {
  it('shows the photo and zooms it', async () => {
    render(<InspirationPanel url="https://cdn/x.jpg" />);
    const img = screen.getByAltText('Modèle d’inspiration du client');
    expect(img).toHaveAttribute('src', 'https://cdn/x.jpg');
    // The photo and the pattern laid over it zoom together (the stage holds both).
    const stage = screen.getByTestId('inspiration-stage');
    await userEvent.click(screen.getByRole('button', { name: 'Zoomer le modèle' }));
    expect(stage.style.transform).toContain('scale(1.3)');
    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser le modèle' }));
    expect(stage.style.transform).toContain('scale(1)');
  });

  it('explains when there is no photo or it fails to load', () => {
    const { unmount } = render(<InspirationPanel url={null} />);
    expect(screen.getByText('Aucune photo d’inspiration pour ce projet.')).toBeInTheDocument();
    unmount();
    render(<InspirationPanel url="https://cdn/broken.jpg" />);
    screen.getByAltText('Modèle d’inspiration du client').dispatchEvent(new Event('error'));
  });
});
