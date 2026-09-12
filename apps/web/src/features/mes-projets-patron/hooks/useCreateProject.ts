'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createPatternProject } from '../api/pattern-projects.api';
import { MY_PATTERN_PROJECTS_KEY } from './usePatternProjects';
import { ROUTES } from '@/lib/routes';
import { REDIRECT_TO_PARAM } from '@/features/authentification/consts/queryKeys';
import { ApiError } from '@/lib/api-client';

export const useCreateProject = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status } = useSession();

  return useMutation({
    mutationFn: async (garmentType: string = 'ROBE') => {
      if (status !== 'authenticated') {
        router.push(`${ROUTES.connexion}?${REDIRECT_TO_PARAM}=${encodeURIComponent('/mes-projets-patron')}`);
        return null;
      }
      return await createPatternProject(garmentType);
    },
    onSuccess: (project) => {
      if (!project) return;
      void queryClient.invalidateQueries({ queryKey: MY_PATTERN_PROJECTS_KEY });
      router.push(`/pattern-studio/wizard/${project.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 401) {
        router.push(`${ROUTES.connexion}?${REDIRECT_TO_PARAM}=${encodeURIComponent('/mes-projets-patron')}`);
      }
    },
  });
};
