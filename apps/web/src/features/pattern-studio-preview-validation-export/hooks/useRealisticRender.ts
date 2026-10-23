import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RealisticRenderDto, RealisticRenderPose } from '@angaly/types';
import {
  fetchLatestRealisticRender,
  fetchRealisticRender,
  requestRealisticRender,
} from '../api/realistic-render.api';
import { isRenderPending } from '../utils/realistic-render';

/** The API is polled this often while the cloth-sim worker runs (a render takes 3 to 6 minutes). */
export const REALISTIC_RENDER_POLL_MS = 5000;

export const REALISTIC_RENDER_KEY = (versionId: string, pose: RealisticRenderPose) =>
  ['realistic-render', versionId, pose] as const;

/**
 * The realistic render (Blender cloth simulation) of a pattern version in one pose: the latest one on load, then the
 * one being simulated, polled until it is DONE or FAILED. `request` queues a render (or gets the cached one).
 */
export const useRealisticRender = (versionId: string | null, pose: RealisticRenderPose) => {
  const queryClient = useQueryClient();
  const key = REALISTIC_RENDER_KEY(versionId ?? '', pose);

  const query = useQuery<RealisticRenderDto | null>({
    queryKey: key,
    enabled: Boolean(versionId),
    queryFn: async () => {
      const current = queryClient.getQueryData<RealisticRenderDto | null>(key);
      if (versionId && current && isRenderPending(current.status)) {
        return fetchRealisticRender(versionId, current.id);
      }
      return versionId ? fetchLatestRealisticRender(versionId, pose) : null;
    },
    refetchInterval: (q) => (isRenderPending(q.state.data?.status) ? REALISTIC_RENDER_POLL_MS : false),
    refetchOnWindowFocus: false,
  });

  const request = useMutation({
    mutationFn: () => {
      if (!versionId) throw new Error('Aucune version de patron à simuler.');
      return requestRealisticRender(versionId, pose);
    },
    onSuccess: (render) => {
      queryClient.setQueryData(key, render);
    },
  });

  return { render: query.data ?? null, isLoading: query.isLoading, request };
};
