import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createMeasurementProfile,
  updateMeasurementProfile,
} from '../api/measurement-profiles.api';
import type {
  CreateMeasurementProfileDto,
  UpdateMeasurementProfileDto,
} from '../api/measurement-profiles.api';
import { MEASUREMENT_PROFILES_QUERY_KEY } from './useMeasurementProfiles';

export const useMeasurementProfileForm = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateMeasurementProfileDto) => createMeasurementProfile(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEASUREMENT_PROFILES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMeasurementProfileDto }) =>
      updateMeasurementProfile(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEASUREMENT_PROFILES_QUERY_KEY });
    },
  });

  return {
    createProfile: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
