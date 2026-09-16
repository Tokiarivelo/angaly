'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

import type { UploadEntry } from '../hooks/useMediaUpload';

interface UploadEntriesListProps {
  entries: UploadEntry[];
  onDismiss: () => void;
}

/**
 * Surfaces per-file upload status/errors — previously tracked in state but
 * never rendered, so a failed upload in a multi-file batch was invisible
 * beyond the aggregate "Import en cours…" button label.
 */
export const UploadEntriesList: React.FC<UploadEntriesListProps> = ({ entries, onDismiss }) => {
  if (entries.length === 0) return null;

  return (
    <div className="w-full border border-border rounded-lg divide-y divide-border bg-white">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-xs font-medium text-angaly-slate">Import ({entries.length})</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Effacer la liste des imports terminés"
          className="text-angaly-slate hover:text-angaly-navy"
        >
          <X size={14} />
        </button>
      </div>
      <ul className="max-h-48 overflow-y-auto">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center gap-2 px-3 py-2 text-xs">
            {entry.status === 'uploading' && (
              <Loader2 size={14} className="shrink-0 animate-spin text-angaly-slate" aria-hidden="true" />
            )}
            {entry.status === 'done' && (
              <CheckCircle2 size={14} className="shrink-0 text-angaly-success" aria-hidden="true" />
            )}
            {entry.status === 'error' && (
              <AlertCircle size={14} className="shrink-0 text-angaly-error" aria-hidden="true" />
            )}
            <span className="flex-1 truncate text-angaly-navy">{entry.fileName}</span>
            {entry.status === 'error' && entry.errorMessage && (
              <span className="text-angaly-error">{entry.errorMessage}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
