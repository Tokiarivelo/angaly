import { useQuery } from '@tanstack/react-query';
import { fetchInProgressProject } from '../api/pattern-projects.api';

export const IN_PROGRESS_PROJECT_QUERY_KEY = ['pattern-projects', 'in-progress'];

export const useInProgressProject = () => {
  return useQuery({
    queryKey: IN_PROGRESS_PROJECT_QUERY_KEY,
    queryFn: fetchInProgressProject,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: false,
  });
};
