'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createPatternProject, type CreatePatternProjectPayload } from '../api/pattern-projects.api';
import { IN_PROGRESS_PROJECT_QUERY_KEY } from './useInProgressProject';
import { ROUTES } from '@/lib/routes';
import { REDIRECT_TO_PARAM } from '@/features/authentification/consts/queryKeys';
import { ApiError } from '@/lib/api-client';

export const useCreatePatternProject = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status } = useSession();

  return useMutation({
    mutationFn: async (payload?: CreatePatternProjectPayload) => {
      if (status !== 'authenticated') {
        router.push(`${ROUTES.connexion}?${REDIRECT_TO_PARAM}=${encodeURIComponent('/pattern-studio')}`);
        return null;
      }
      return await createPatternProject(payload);
    },
    onSuccess: (project) => {
      if (!project) return;
      void queryClient.invalidateQueries({ queryKey: IN_PROGRESS_PROJECT_QUERY_KEY });
      router.push(`/pattern-studio/wizard/${project.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 401) {
        router.push(`${ROUTES.connexion}?${REDIRECT_TO_PARAM}=${encodeURIComponent('/pattern-studio')}`);
      }
    },
  });
};
