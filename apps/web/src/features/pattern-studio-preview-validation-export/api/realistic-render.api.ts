import { apiClient } from '@/lib/api-client';
import type { RealisticRenderDto, RealisticRenderPose } from '@angaly/types';

/** The API wraps answers in `{ success, data }`; the client may already have unwrapped it. */
const unwrap = <T>(res: T | { data: T }): T =>
  res !== null && typeof res === 'object' && 'data' in res ? res.data : res;

const base = (versionId: string): string => `/api/pattern-versions/${versionId}/realistic-render`;

/** Queues a realistic render (Blender cloth simulation), or returns the one already done for the same garment. */
export const requestRealisticRender = async (
  versionId: string,
  pose: RealisticRenderPose,
): Promise<RealisticRenderDto> =>
  unwrap(await apiClient.post<RealisticRenderDto | { data: RealisticRenderDto }>(base(versionId), { pose }));

export const fetchRealisticRender = async (versionId: string, renderId: string): Promise<RealisticRenderDto> =>
  unwrap(await apiClient.get<RealisticRenderDto | { data: RealisticRenderDto }>(`${base(versionId)}/${renderId}`));

/** Latest render of the version in this pose, `null` when there is none yet. */
export const fetchLatestRealisticRender = async (
  versionId: string,
  pose: RealisticRenderPose,
): Promise<RealisticRenderDto | null> => {
  const res = await apiClient.get<RealisticRenderDto | { data: RealisticRenderDto | null } | null | ''>(
    `${base(versionId)}?pose=${pose}`,
  );
  if (!res) return null;
  const render = unwrap(res);
  return render && typeof render === 'object' && 'id' in render ? render : null;
};
