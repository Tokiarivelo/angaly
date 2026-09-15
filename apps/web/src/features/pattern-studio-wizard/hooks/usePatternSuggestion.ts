'use client';

import { useMutation } from '@tanstack/react-query';
import { requestPatternSuggestion } from '../api/pattern-projects.api';
import type { RequestPatternSuggestionPayload } from '../api/pattern-projects.api';

export const usePatternSuggestion = () => {
  return useMutation({
    mutationFn: (payload: RequestPatternSuggestionPayload) => requestPatternSuggestion(payload),
  });
};
