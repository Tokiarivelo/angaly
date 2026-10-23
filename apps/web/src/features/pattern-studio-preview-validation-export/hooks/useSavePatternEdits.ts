import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PatternPieceDto, PatternPieceInput } from '@angaly/types';
import { savePatternEdits } from '../api/pattern-versions.api';
import { PATTERN_PROJECT_KEY } from './usePatternVersion';
import { PATTERN_VERSIONS_KEY } from './useVersionHistory';

export const toPieceInput = (piece: PatternPieceDto): PatternPieceInput => ({
  name: piece.name.trim() || 'Pièce',
  dimensionsJson: piece.dimensionsJson,
  fabricRecommendation: piece.fabricRecommendation,
  quantity: piece.quantity,
  grainlineJson: piece.grainlineJson,
  seamAllowanceCm: piece.seamAllowanceCm,
  notchesJson: piece.notchesJson,
});

interface SaveEditsVariables {
  versionId: string;
  pieces: PatternPieceDto[];
  changeLabel?: string | undefined;
}

/** Saves the studio's pieces as a new version, then refreshes the project. */
export const useSavePatternEdits = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ versionId, pieces, changeLabel }: SaveEditsVariables) =>
      savePatternEdits(versionId, { pieces: pieces.map(toPieceInput), changeLabel }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PATTERN_PROJECT_KEY(projectId) });
      void queryClient.invalidateQueries({ queryKey: PATTERN_VERSIONS_KEY(projectId) });
    },
  });
};
