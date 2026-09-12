import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createPatternProject } from '../api/pattern-projects.api';
import { MY_PATTERN_PROJECTS_KEY } from './usePatternProjects';

export const useCreateProject = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (garmentType: string = 'ROBE') => createPatternProject(garmentType),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: MY_PATTERN_PROJECTS_KEY });
      router.push(`/pattern-studio/wizard/${project.id}`);
    },
  });
};
