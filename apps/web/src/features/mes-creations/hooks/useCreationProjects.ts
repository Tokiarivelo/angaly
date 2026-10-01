import { useQuery } from '@tanstack/react-query';
import { CREATION_PROJECT_STAGES_ORDER, type CreationProjectDto, type CreationProjectStage } from '@angaly/types';
import { fetchMyCreationProjects } from '../api/creation-projects.api';

export const MY_CREATION_PROJECTS_KEY = ['creation-projects', 'mine'];

export type CreationStepState = 'done' | 'current' | 'upcoming';

/** État de chaque étape du stepper pour un projet (l'étape Terminée est « done » une fois atteinte). */
export const getCreationStepStates = (
  stage: CreationProjectStage,
): { stage: CreationProjectStage; state: CreationStepState }[] => {
  const currentIndex = CREATION_PROJECT_STAGES_ORDER.indexOf(stage);
  const isLast = currentIndex === CREATION_PROJECT_STAGES_ORDER.length - 1;
  return CREATION_PROJECT_STAGES_ORDER.map((step, index) => ({
    stage: step,
    state: index < currentIndex || (isLast && index === currentIndex) ? 'done' : index === currentIndex ? 'current' : 'upcoming',
  }));
};

export const useCreationProjects = () => {
  const query = useQuery<CreationProjectDto[]>({
    queryKey: MY_CREATION_PROJECTS_KEY,
    queryFn: fetchMyCreationProjects,
    staleTime: 1000 * 60,
  });
  return query;
};
