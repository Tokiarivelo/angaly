'use client';

import { useCallback, useState } from 'react';
import type { usePatternDraft } from './usePatternDraft';
import { useSavePatternEdits } from './useSavePatternEdits';
import { hasSelfIntersection, pieceOutline } from '../utils/pattern-editing';

type PatternDraft = ReturnType<typeof usePatternDraft>;

export interface DraftMessage {
  kind: 'ok' | 'error';
  text: string;
}

/**
 * Saves the shared draft (studio 2D or modelling in 3D) as a new version: refused while an outline crosses
 * itself (it could not be cut), then the draft is cleared so the views show the saved pieces.
 */
export const useSaveDraft = (projectId: string, versionId: string | null, draft: PatternDraft) => {
  const save = useSavePatternEdits(projectId);
  const [message, setMessage] = useState<DraftMessage | null>(null);

  const submit = useCallback(
    (label = '', onSaved?: () => void): void => {
      if (!versionId || !draft.dirty) return;
      const broken = draft.pieces.filter((p) => hasSelfIntersection(pieceOutline(p)));
      if (broken.length > 0) {
        setMessage({ kind: 'error', text: `Contour croisé : ${broken.map((p) => p.name).join(', ')}.` });
        return;
      }
      setMessage(null);
      save.mutate(
        { versionId, pieces: draft.pieces, changeLabel: label.trim() || undefined },
        {
          onSuccess: () => {
            draft.reset();
            onSaved?.();
            setMessage({ kind: 'ok', text: 'Nouvelle version enregistrée.' });
          },
          onError: () => setMessage({ kind: 'error', text: 'Enregistrement impossible. Réessayez.' }),
        },
      );
    },
    [draft, save, versionId],
  );

  return {
    submit,
    isPending: save.isPending,
    canSave: Boolean(versionId) && draft.dirty && !save.isPending,
    message,
    setMessage,
  };
};
