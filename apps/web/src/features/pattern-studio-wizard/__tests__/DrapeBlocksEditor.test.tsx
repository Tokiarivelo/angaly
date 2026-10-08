import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DrapeBlocksEditor } from '../ui/steps/DrapeBlocksEditor';

describe('DrapeBlocksEditor', () => {
  it('offers nothing for a garment without blocks', () => {
    const { container } = render(<DrapeBlocksEditor garmentType="PANTALON" value={undefined} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('a skirt only offers the blocks that make sense for a skirt', () => {
    render(<DrapeBlocksEditor garmentType="JUPE" value={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Jupe froncée')).toBeInTheDocument();
    expect(screen.getByLabelText('Traîne')).toBeInTheDocument();
    expect(screen.queryByLabelText('Col bénitier')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Bustier drapé')).not.toBeInTheDocument();
  });

  it('a dress offers all nine blocks', () => {
    render(<DrapeBlocksEditor garmentType="ROBE" value={undefined} onChange={vi.fn()} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(9);
  });

  it('switching a block on reports a spec with its defaults; the controls appear once enabled', () => {
    const onChange = vi.fn();
    const { rerender } = render(<DrapeBlocksEditor garmentType="ROBE" value={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Traîne'));
    expect(onChange).toHaveBeenCalledWith({ blocks: [{ kind: 'TRAIN', lengthMm: 600 }] });
    expect(screen.queryByLabelText('Longueur de traîne')).not.toBeInTheDocument();

    rerender(<DrapeBlocksEditor garmentType="ROBE" value={{ blocks: [{ kind: 'TRAIN', lengthMm: 600 }] }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Longueur de traîne'), { target: { value: '900' } });
    expect(onChange).toHaveBeenLastCalledWith({ blocks: [{ kind: 'TRAIN', lengthMm: 900 }] });
  });

  it('shows the photo suggestion, tagged, and lets the customer reset to it', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DrapeBlocksEditor
        garmentType="ROBE_MARIEE"
        value={undefined}
        suggested={{ blocks: [{ kind: 'TRAIN', lengthMm: 900 }] }}
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText('Traîne')).toBeChecked();
    expect(screen.getByLabelText('Longueur de traîne')).toHaveValue('900');
    expect(screen.getByText(/Suggéré par l’IA — modifiable/)).toBeInTheDocument();
    expect(screen.queryByText('Réinitialiser')).not.toBeInTheDocument();

    rerender(
      <DrapeBlocksEditor
        garmentType="ROBE_MARIEE"
        value={{ blocks: [{ kind: 'TRAIN', lengthMm: 500 }] }}
        suggested={{ blocks: [{ kind: 'TRAIN', lengthMm: 900 }] }}
        onChange={onChange}
      />,
    );
    expect(screen.queryByText(/Suggéré par l’IA/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Réinitialiser'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('unchecking the suggested block stores an explicit empty choice', () => {
    const onChange = vi.fn();
    render(
      <DrapeBlocksEditor
        garmentType="ROBE"
        value={undefined}
        suggested={{ blocks: [{ kind: 'TRAIN', lengthMm: 900 }] }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Traîne'));
    expect(onChange).toHaveBeenCalledWith({ blocks: [] });
  });

  it('only one skirt block at a time, circle fractions and pleat type are selectable', () => {
    const onChange = vi.fn();
    render(
      <DrapeBlocksEditor
        garmentType="JUPE"
        value={{ blocks: [{ kind: 'CIRCLE_SKIRT', fraction: 0.5 }] }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Cercle complet' }));
    expect(onChange).toHaveBeenLastCalledWith({ blocks: [{ kind: 'CIRCLE_SKIRT', fraction: 1 }] });
    fireEvent.click(screen.getByLabelText('Jupe plissée'));
    expect(onChange).toHaveBeenLastCalledWith({ blocks: [{ kind: 'PLEATED_SKIRT', pleats: 24, depthMm: 25, type: 'KNIFE' }] });
  });
});
