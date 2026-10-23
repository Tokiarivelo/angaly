import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SculptToolbar, TOOL_BY_KEY } from '../ui/SculptToolbar';

const props = (over: Partial<React.ComponentProps<typeof SculptToolbar>> = {}): React.ComponentProps<typeof SculptToolbar> => ({
  mode: 'sculpt',
  onModeChange: vi.fn(),
  tool: 'grab',
  onToolChange: vi.fn(),
  radiusMm: 80,
  onRadiusChange: vi.fn(),
  falloff: 'smooth',
  onFalloffChange: vi.fn(),
  propagate: true,
  onPropagateChange: vi.fn(),
  blocked: false,
  canUndo: true,
  canRedo: false,
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  dirty: true,
  onDiscard: vi.fn(),
  canSave: true,
  isSaving: false,
  onSave: vi.fn(),
  message: null,
  ...over,
});

describe('SculptToolbar', () => {
  it('switches between the Object, Sculpt and Edit modes, brush settings in Sculpt only', () => {
    const p = props({ mode: 'view', editOptions: <div data-testid="edit-options" /> });
    const { rerender } = render(<SculptToolbar {...p} />);
    expect(screen.queryByRole('radiogroup', { name: 'Outil de modelage' })).toBeNull();
    expect(screen.queryByTestId('edit-options')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Sculpture/ }));
    expect(p.onModeChange).toHaveBeenCalledWith('sculpt');
    fireEvent.click(screen.getByRole('radio', { name: /Édition/ }));
    expect(p.onModeChange).toHaveBeenCalledWith('edit');
    rerender(<SculptToolbar {...p} mode="edit" />);
    expect(screen.getByTestId('edit-options')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Édition/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('picks a tool, the radius, the falloff and the neighbours', () => {
    const p = props();
    render(<SculptToolbar {...p} />);
    fireEvent.click(screen.getByRole('radio', { name: /Longueur/ }));
    expect(p.onToolChange).toHaveBeenCalledWith('length');
    fireEvent.change(screen.getByLabelText('Rayon du pinceau'), { target: { value: '120' } });
    expect(p.onRadiusChange).toHaveBeenCalledWith(120);
    expect(screen.getByText('8.0 cm')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Atténuation du pinceau'), { target: { value: 'sharp' } });
    expect(p.onFalloffChange).toHaveBeenCalledWith('sharp');
    fireEvent.click(screen.getByRole('checkbox', { name: /Pièces voisines/ }));
    expect(p.onPropagateChange).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('sculpt-hint')).toHaveTextContent('Modeler');
  });

  it('drives the history and the save', () => {
    const p = props();
    render(<SculptToolbar {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(p.onUndo).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Rétablir' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner les retouches' }));
    expect(p.onDiscard).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer une version/ }));
    expect(p.onSave).toHaveBeenCalled();
  });

  it('warns about a blocked stroke and shows the save result', () => {
    render(<SculptToolbar {...props({ blocked: true, message: { kind: 'ok', text: 'Nouvelle version enregistrée.' } })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Le contour se croiserait');
    expect(screen.getByRole('status')).toHaveTextContent('Nouvelle version enregistrée.');
  });

  it('maps the keyboard shortcuts to the tools', () => {
    expect(TOOL_BY_KEY).toEqual({ g: 'grab', w: 'width', l: 'length', s: 'smooth' });
  });
});
