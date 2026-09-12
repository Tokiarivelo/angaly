import { render, screen, } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessagesFacturesNotificationsPage } from '../ui/MessagesFacturesNotificationsPage';

// Mock hooks
vi.mock('../hooks/useClientSpaceTab', () => ({
  useClientSpaceTab: () => ({ currentTab: 'messages', setTab: vi.fn() })
}));
vi.mock('../hooks/useConversations', () => ({
  useConversations: () => ({ threads: [], activeThreadId: null, setActiveThreadId: vi.fn() })
}));
vi.mock('../hooks/useConversationThread', () => ({
  useConversationThread: () => ({ messages: [] })
}));
vi.mock('../hooks/useInvoices', () => ({
  useInvoices: () => ({ invoices: [] })
}));
vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({ notifications: [] })
}));
vi.mock('../hooks/useSendMessage', () => ({
  useSendMessage: () => ({ sendMessage: vi.fn() })
}));
vi.mock('../hooks/useMarkNotificationsRead', () => ({
  useMarkNotificationsRead: () => ({ markAllRead: vi.fn() })
}));
vi.mock('../hooks/useDownloadInvoice', () => ({
  useDownloadInvoice: () => ({ download: vi.fn() })
}));

describe('MessagesFacturesNotificationsPage', () => {
  it('renders messages tab correctly', () => {
    render(<MessagesFacturesNotificationsPage />);
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Factures')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
});
