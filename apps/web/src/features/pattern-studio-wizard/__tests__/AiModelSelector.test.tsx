import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AiProviderId } from '@angaly/types';
import { AiModelSelector } from '../ui/AiModelSelector';

const providers = [
  { provider: AiProviderId.LOCAL_STATISTICAL, name: 'Modèle statistique local', model: 'ansur2-ridge-v1' },
  { provider: AiProviderId.ANTHROPIC, name: 'Claude (Anthropic)', model: 'claude-sonnet-5-5' },
];

describe('AiModelSelector', () => {
  it('renders nothing when no provider is selectable', () => {
    const { container } = render(<AiModelSelector providers={[]} value={undefined} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('offers automatic routing plus each provider and reports the choice', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<AiModelSelector providers={providers} value={undefined} onChange={onChange} />);

    expect(screen.getByRole('option', { name: /Automatique/ })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Modèle IA'), AiProviderId.ANTHROPIC);

    expect(onChange).toHaveBeenCalledWith(AiProviderId.ANTHROPIC);
  });

  it('goes back to automatic routing with undefined', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<AiModelSelector providers={providers} value={AiProviderId.ANTHROPIC} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Modèle IA'), '');

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
