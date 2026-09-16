import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PageSectionVersionDto } from '../api/page-sections.api';
import { VersionHistoryDrawer } from '../ui/VersionHistoryDrawer';

const VERSION: PageSectionVersionDto = {
  id: 'version-1',
  pageSectionId: 'section-1',
  snapshotJson: { titleText: 'Ancien titre' },
  editedById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('VersionHistoryDrawer', () => {
  it('renders nothing when closed', () => {
    render(
      <VersionHistoryDrawer
        isOpen={false}
        onClose={vi.fn()}
        versions={[]}
        isLoading={false}
        onRestore={vi.fn()}
        isRestoring={false}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists versions and triggers onRestore', async () => {
    const onRestore = vi.fn();
    const user = userEvent.setup();
    render(
      <VersionHistoryDrawer
        isOpen
        onClose={vi.fn()}
        versions={[VERSION]}
        isLoading={false}
        onRestore={onRestore}
        isRestoring={false}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Historique des versions' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restaurer' }));

    expect(onRestore).toHaveBeenCalledWith('version-1');
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <VersionHistoryDrawer
        isOpen
        onClose={onClose}
        versions={[]}
        isLoading={false}
        onRestore={vi.fn()}
        isRestoring={false}
      />,
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('shows an empty message when there are no versions yet', () => {
    render(
      <VersionHistoryDrawer
        isOpen
        onClose={vi.fn()}
        versions={[]}
        isLoading={false}
        onRestore={vi.fn()}
        isRestoring={false}
      />,
    );

    expect(screen.getByText('Aucune version enregistrée pour cette section.')).toBeInTheDocument();
  });
});
