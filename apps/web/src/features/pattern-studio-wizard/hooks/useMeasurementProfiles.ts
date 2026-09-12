import { useQuery } from '@tanstack/react-query';
import { fetchMeasurementProfiles } from '../api/measurements.api';

export const MEASUREMENT_PROFILES_KEY = ['measurement-profiles', 'wizard'];

export const useMeasurementProfiles = () => {
  return useQuery({
    queryKey: MEASUREMENT_PROFILES_KEY,
    queryFn: fetchMeasurementProfiles,
    staleTime: 1000 * 60 * 5,
  });
};
