import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FitAdjustments } from '../ui/steps/FitAdjustments';

describe('FitAdjustments', () => {
  it('shows the photo suggestion on the controls, tagged and editable', () => {
    render(
      <FitAdjustments
        garmentType="ROBE"
        value={undefined}
        suggested={{ ease: 'AMPLE', fullness: { skirt: 2 } }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: /Ample/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Ampleur de jupe')).toHaveValue('2');
    expect(screen.getAllByText(/Suggéré par l’IA — modifiable/).length).toBe(2);
    expect(screen.queryByText('Réinitialiser')).not.toBeInTheDocument();
  });

  it('a customer choice replaces the suggestion for that control only and can be reset', () => {
    const onChange = vi.fn();
    render(
      <FitAdjustments
        garmentType="ROBE"
        value={{ fullness: { skirt: 3 } }}
        suggested={{ ease: 'AMPLE', fullness: { skirt: 2 } }}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText('Ampleur de jupe')).toHaveValue('3');
    expect(screen.getAllByText(/Suggéré par l’IA/).length).toBe(1); // only the ease is still a suggestion
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    expect(onChange).toHaveBeenCalledWith({ field: 'fullness.skirt', value: null });
  });

  it('stores an explicit CONFORT so the customer can beat an AMPLE suggestion', () => {
    const onChange = vi.fn();
    render(<FitAdjustments garmentType="ROBE" value={undefined} suggested={{ ease: 'AMPLE' }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('radio', { name: /Confort/ }));
    expect(onChange).toHaveBeenCalledWith({ field: 'ease', value: 'CONFORT' });
  });

  it('only offers the adjustments that make sense for the garment', () => {
    render(<FitAdjustments garmentType="PANTALON" value={undefined} onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Ampleur de jupe')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Longueur de manche')).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Aisance' })).toBeInTheDocument();
  });

  it('moving a slider reports the new number', () => {
    const onChange = vi.fn();
    render(<FitAdjustments garmentType="JUPE" value={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Longueur de jupe'), { target: { value: '85' } });
    expect(onChange).toHaveBeenCalledWith({ field: 'lengths.skirtPct', value: 85 });
  });
});
