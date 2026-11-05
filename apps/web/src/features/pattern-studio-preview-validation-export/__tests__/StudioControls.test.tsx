import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StudioControls } from '../ui/StudioControls';
import { DEFAULT_STUDIO_SETTINGS, type StudioSettings } from '../utils/studio3d/studio-settings';

const setup = (settings: StudioSettings = DEFAULT_STUDIO_SETTINGS) => {
  const handlers = {
    onLightingChange: vi.fn(),
    onShadowsChange: vi.fn(),
    onAoChange: vi.fn(),
    onQualityChange: vi.fn(),
  };
  const onStageKey = vi.fn();
  render(
    <div onKeyDown={onStageKey}>
      <StudioControls settings={settings} tier="medium" {...handlers} />
      <p>ailleurs</p>
    </div>,
  );
  return { ...handlers, onStageKey, toggle: screen.getByRole('button', { name: 'Réglages du rendu' }) };
};

describe('StudioControls', () => {
  it('opens and closes from its button', async () => {
    const user = userEvent.setup();
    const { toggle } = setup();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'Réglages du rendu' })).not.toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Réglages du rendu' })).toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape, gives the focus back, and keeps keys away from the stage', async () => {
    const user = userEvent.setup();
    const { toggle, onStageKey } = setup();
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Doux' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Réglages du rendu' })).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
    expect(onStageKey).not.toHaveBeenCalled();
  });

  it('closes on a click outside', async () => {
    const user = userEvent.setup();
    const { toggle } = setup();
    await user.click(toggle);
    fireEvent.pointerDown(screen.getByText('ailleurs'));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('calls each setter', async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.click(h.toggle);

    const lighting = screen.getByRole('group', { name: 'Éclairage' });
    expect(screen.getByRole('button', { name: 'Studio' })).toHaveAttribute('aria-pressed', 'true');
    expect(lighting).toContainElement(screen.getByRole('button', { name: 'Contraste' }));
    await user.click(screen.getByRole('button', { name: 'Contraste' }));
    expect(h.onLightingChange).toHaveBeenCalledWith('contrast');

    const shadows = screen.getByRole('switch', { name: 'Ombres' });
    expect(shadows).toHaveAttribute('aria-checked', 'true');
    await user.click(shadows);
    expect(h.onShadowsChange).toHaveBeenCalledWith(false);
    await user.click(screen.getByRole('switch', { name: 'Occlusion' }));
    expect(h.onAoChange).toHaveBeenCalledWith(false);

    expect(screen.getByRole('group', { name: 'Qualité' })).toBeInTheDocument();
    for (const [label, value] of [
      ['Haute', 'high'],
      ['Moyenne', 'medium'],
      ['Basse', 'low'],
      ['Auto', 'auto'],
    ] as const) {
      await user.click(screen.getByRole('button', { name: label }));
      expect(h.onQualityChange).toHaveBeenLastCalledWith(value);
    }
  });

  it('shows the real tier only in auto', async () => {
    const user = userEvent.setup();
    const { toggle } = setup();
    await user.click(toggle);
    expect(screen.getByTestId('studio-auto-tier')).toHaveTextContent('moyenne');
    // The medium tier has no AO: the switch is on, but a note says why nothing changes.
    expect(screen.getByTestId('studio-ao-note')).toBeInTheDocument();
  });

  it('hides the real tier when a tier is chosen, and shows switches off', async () => {
    const user = userEvent.setup();
    const { toggle } = setup({ lighting: 'soft', shadows: false, ao: false, quality: 'low' });
    await user.click(toggle);
    expect(screen.queryByTestId('studio-auto-tier')).not.toBeInTheDocument();
    expect(screen.queryByTestId('studio-ao-note')).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Ombres' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: 'Basse' })).toHaveAttribute('aria-pressed', 'true');
  });
});
