'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreationProjectStage } from '@angaly/types';
import { adminCreationProjectsApi } from '../api/admin-creation-projects.api';
import { ADMIN_CREATION_PROJECTS_QUERY_KEYS } from '../consts/queryKeys';

/** Détail d'un projet (+ historique), liste des assignables et mutations étape / assignation. */
export function useAdminCreationProject(id: string) {
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.detail(id),
    queryFn: () => adminCreationProjectsApi.get(id),
  });

  const assigneesQuery = useQuery({
    queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.assignees,
    queryFn: () => adminCreationProjectsApi.listAssignees(),
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.all });

  const updateStageMutation = useMutation({
    mutationFn: (stage: CreationProjectStage) => adminCreationProjectsApi.updateStage(id, stage),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string | null) => adminCreationProjectsApi.assign(id, userId),
    onSuccess: invalidate,
  });

  return {
    project: projectQuery.data,
    isLoading: projectQuery.isLoading,
    isError: projectQuery.isError,
    error: projectQuery.error,
    refetch: projectQuery.refetch,
    assignees: assigneesQuery.data ?? [],
    updateStage: updateStageMutation.mutateAsync,
    isUpdatingStage: updateStageMutation.isPending,
    assign: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
  };
}
