import { QuoteStatus } from '@angaly/types';

export interface QuoteStatusConfig {
  label: string;
  variant: 'info' | 'success' | 'error' | 'slate' | 'warning';
}

export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, QuoteStatusConfig> = {
  [QuoteStatus.DRAFT]: { label: 'Brouillon', variant: 'slate' },
  [QuoteStatus.SENT]: { label: 'En attente', variant: 'info' },
  [QuoteStatus.VIEWED]: { label: 'En analyse', variant: 'info' },
  [QuoteStatus.ACCEPTED]: { label: 'Accepté', variant: 'success' },
  [QuoteStatus.REJECTED]: { label: 'Refusé', variant: 'error' },
  [QuoteStatus.EXPIRED]: { label: 'Expiré', variant: 'error' },
};
