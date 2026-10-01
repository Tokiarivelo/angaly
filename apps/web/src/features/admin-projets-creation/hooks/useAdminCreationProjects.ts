import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreationProjectStage } from '@angaly/types';
import { adminCreationProjectsApi } from '../api/admin-creation-projects.api';
import { ADMIN_CREATION_PROJECTS_QUERY_KEYS } from '../consts/queryKeys';

export function useAdminCreationProjects(selectedStage?: CreationProjectStage) {
  const queryClient = useQueryClient();

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.list(selectedStage),
    queryFn: () => adminCreationProjectsApi.list(selectedStage),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: CreationProjectStage }) =>
      adminCreationProjectsApi.updateStage(id, stage),
    onSuccess: () => {
      // Invalidate queries so all counts and lists refresh
      void queryClient.invalidateQueries({ queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.all });
    },
  });

  return {
    projects,
    isLoading,
    isError,
    error,
    refetch,
    updateStage: updateStageMutation.mutateAsync,
    isUpdating: updateStageMutation.isPending,
    updatingVariables: updateStageMutation.variables,
  };
}
