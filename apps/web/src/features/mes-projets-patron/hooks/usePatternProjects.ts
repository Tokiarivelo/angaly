import { useQuery } from '@tanstack/react-query';
import { fetchMyPatternProjects } from '../api/pattern-projects.api';

export const MY_PATTERN_PROJECTS_KEY = ['pattern-projects', 'mine'];

export const usePatternProjects = () => {
  return useQuery({
    queryKey: MY_PATTERN_PROJECTS_KEY,
    queryFn: fetchMyPatternProjects,
    staleTime: 1000 * 60,
  });
};
