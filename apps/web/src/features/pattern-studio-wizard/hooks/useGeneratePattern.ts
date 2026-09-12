'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { generatePattern } from '../api/pattern-projects.api';

export const useGeneratePattern = (projectId: string) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { measurements?: Record<string, number> | undefined }) =>
      generatePattern(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pattern-project', projectId] });
      // Redirect to preview and validation studio screen
      router.push(`/pattern-studio/projects/${projectId}`);
    },
  });
};
