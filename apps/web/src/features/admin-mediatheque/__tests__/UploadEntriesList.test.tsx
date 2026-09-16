import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { UploadEntry } from '../hooks/useMediaUpload';
import { UploadEntriesList } from '../ui/UploadEntriesList';

describe('UploadEntriesList', () => {
  it('renders nothing when there are no entries', () => {
    const { container } = render(<UploadEntriesList entries={[]} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows each entry with its filename and, for errors, the error message', () => {
    const entries: UploadEntry[] = [
      { id: '1', fileName: 'ok.jpg', status: 'done', mediaId: 'media-1' },
      { id: '2', fileName: 'trop-gros.jpg', status: 'error', errorMessage: 'Fichier trop volumineux (25.0 Mo, 20 Mo max).' },
      { id: '3', fileName: 'en-cours.jpg', status: 'uploading' },
    ];
    render(<UploadEntriesList entries={entries} onDismiss={vi.fn()} />);

    expect(screen.getByText('ok.jpg')).toBeInTheDocument();
    expect(screen.getByText('trop-gros.jpg')).toBeInTheDocument();
    expect(screen.getByText('Fichier trop volumineux (25.0 Mo, 20 Mo max).')).toBeInTheDocument();
    expect(screen.getByText('en-cours.jpg')).toBeInTheDocument();
    expect(screen.getByText('Import (3)')).toBeInTheDocument();
  });

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <UploadEntriesList entries={[{ id: '1', fileName: 'ok.jpg', status: 'done' }]} onDismiss={onDismiss} />,
    );

    await user.click(screen.getByRole('button', { name: 'Effacer la liste des imports terminés' }));

    expect(onDismiss).toHaveBeenCalled();
  });
});
