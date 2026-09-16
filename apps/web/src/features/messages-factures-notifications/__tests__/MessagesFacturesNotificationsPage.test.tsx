import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { MessagesFacturesNotificationsPage } from '../ui/MessagesFacturesNotificationsPage';
import { createTestQueryClient } from '@/lib/test-utils';

vi.mock('../hooks/useClientSpaceTab', () => ({
  useClientSpaceTab: () => ({ currentTab: 'messages', setTab: vi.fn() }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue([]),
    patch: vi.fn(),
  },
}));

describe('MessagesFacturesNotificationsPage', () => {
  it('renders the tab bar and the real (empty) conversation list for the messages tab', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MessagesFacturesNotificationsPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Factures')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(await screen.findByText('Aucune conversation')).toBeInTheDocument();
  });
});
