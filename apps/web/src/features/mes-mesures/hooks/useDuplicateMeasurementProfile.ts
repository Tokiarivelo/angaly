import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateMeasurementProfile } from '../api/measurement-profiles.api';
import { MEASUREMENT_PROFILES_QUERY_KEY } from './useMeasurementProfiles';

export const useDuplicateMeasurementProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateMeasurementProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEASUREMENT_PROFILES_QUERY_KEY });
    },
  });
};
