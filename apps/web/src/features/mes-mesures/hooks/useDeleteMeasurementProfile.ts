import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMeasurementProfile } from '../api/measurement-profiles.api';
import { MEASUREMENT_PROFILES_QUERY_KEY } from './useMeasurementProfiles';

export const useDeleteMeasurementProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMeasurementProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEASUREMENT_PROFILES_QUERY_KEY });
    },
  });
};
