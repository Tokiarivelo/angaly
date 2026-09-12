import { useQuery } from '@tanstack/react-query';
import { fetchMeasurementProfiles } from '../api/measurement-profiles.api';

export const MEASUREMENT_PROFILES_QUERY_KEY = ['measurementProfiles'];

export const useMeasurementProfiles = () => {
  return useQuery({
    queryKey: MEASUREMENT_PROFILES_QUERY_KEY,
    queryFn: fetchMeasurementProfiles,
  });
};
