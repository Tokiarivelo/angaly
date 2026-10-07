import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ModelCombobox } from '../ui/ModelCombobox';

const Harness = () => {
  const [value, setValue] = useState('');
  return (
    <ModelCombobox id="m" value={value} onChange={setValue} options={['model-a', 'model-b']} />
  );
};

describe('ModelCombobox', () => {
  it('opens the list on focus and selects an option by click', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'model-b' }));

    expect(screen.getByRole('combobox')).toHaveValue('model-b');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('supports keyboard selection and free text', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('combobox')).toHaveValue('model-a');

    await user.clear(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'custom-id');
    expect(screen.getByRole('combobox')).toHaveValue('custom-id');
  });
});
