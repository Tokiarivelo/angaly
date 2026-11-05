'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';
import type { GarmentModel } from '../utils/garment3d/garment-model';
import { useRealisticRender } from '../hooks/useRealisticRender';
import { isRenderPending, RENDER_STATUS_LABELS, simulatedPose, toRenderPose } from '../utils/realistic-render';
import type { FabricLook } from './fabricTextures';
import { WebGlBoundary } from './WebGlBoundary';
import type { StudioViewSettings } from '../utils/studio3d/studio-settings';

const RealisticRenderViewer = dynamic(() => import('./RealisticRenderViewer').then((m) => m.RealisticRenderViewer), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-sm text-[#D8D3C8]">Chargement de la 3D…</div>
  ),
});

interface RealisticRenderSectionProps {
  versionId: string;
  model: GarmentModel;
  /** Pose preset of the preview ('CUSTOM' poses are simulated in the presentation pose). */
  presetId: string;
  fabric?: FabricLook | null | undefined;
  showMannequin?: boolean | undefined;
  /** The 3D panel's studio settings, so both renders share the same light. */
  studio?: StudioViewSettings | undefined;
}

const BUTTON =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed';
const IDLE = 'bg-[#0C2650] border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190]';
const ACTIVE = 'bg-[#C5B190] text-[#041329] border-[#C5B190]';

/**
 * « Rendu réaliste » : the garment simulated by Blender (gravity, folds, closed seams) on the server, in 3 to 6
 * minutes. No Stitch mock-up for it: same controls as the rest of the 3D panel. docs/features/realistic-render-blender.md.
 */
export const RealisticRenderSection: React.FC<RealisticRenderSectionProps> = ({
  versionId,
  model,
  presetId,
  fabric,
  showMannequin = true,
  studio,
}) => {
  const pose = toRenderPose(presetId);
  const { render, request } = useRealisticRender(versionId, pose);
  const [visible, setVisible] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewerKey, setViewerKey] = useState(0);
  const [contextLost, setContextLost] = useState(false);

  const pending = isRenderPending(render?.status) || request.isPending;
  const ready = render?.status === 'DONE' && Boolean(render.glbUrl);
  const error = request.error instanceof Error ? request.error.message : null;

  return (
    <section data-testid="realistic-render" aria-label="Rendu réaliste" className="flex flex-col gap-3 text-xs text-[#D8D3C8]">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            request.mutate();
          }}
          disabled={pending}
          className={`${BUTTON} ${IDLE}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {ready ? 'Relancer le rendu réaliste' : 'Rendu réaliste'}
        </button>
        {ready && (
          <button
            type="button"
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            className={`${BUTTON} ${visible ? ACTIVE : IDLE}`}
          >
            {visible ? 'Revenir à l’aperçu' : 'Voir le rendu réaliste'}
          </button>
        )}
        {render && (
          <span role="status" data-status={render.status} className="inline-flex items-center gap-2">
            {isRenderPending(render.status) && (
              <span aria-hidden className="w-2 h-2 rounded-full bg-[#C5B190] animate-pulse" />
            )}
            {RENDER_STATUS_LABELS[render.status]}
            {render.status === 'DONE' && render.cached && ' (déjà calculé)'}
            {render.status === 'FAILED' && render.error ? ` : ${render.error}` : ''}
          </span>
        )}
        {request.isPending && !render && <span role="status">Envoi de la demande…</span>}
      </div>

      {error && (
        <p role="alert" className="text-[#F2B8B5]">
          {error}
        </p>
      )}
      {loadError && (
        <p role="alert" className="text-[#F2B8B5]">
          {loadError}
        </p>
      )}

      {ready && visible && render?.glbUrl && (
        <div className="relative h-[420px] rounded-lg overflow-hidden border border-[#C5B190]/20">
          <WebGlBoundary
            key={viewerKey}
            forceError={contextLost}
            onRetry={() => {
              setContextLost(false);
              setViewerKey((k) => k + 1);
            }}
          >
            <RealisticRenderViewer
              glbUrl={render.glbUrl}
              model={model}
              pose={simulatedPose(render)}
              fabric={fabric}
              showMannequin={showMannequin}
              onError={setLoadError}
              onContextLost={() => setContextLost(true)}
              studio={studio}
            />
          </WebGlBoundary>
        </div>
      )}

      <p className="text-[11px] text-[#D8D3C8]/70 leading-relaxed">
        Le rendu réaliste simule le tombé du tissu (poids, plis, coutures) sur un serveur : 3 à 6 minutes. Le mannequin y
        prend la pose de la simulation, bras un peu écartés pour laisser la place aux manches.
        {presetId === 'CUSTOM' && ' Une pose personnalisée est simulée en pose de présentation.'}
      </p>
    </section>
  );
};
