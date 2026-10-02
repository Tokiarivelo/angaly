'use client';

import React, { useState } from 'react';
import { CREATION_PROJECT_STAGES_ORDER, type CreationProjectStage } from '@angaly/types';
import { ADMIN_CREATION_STAGE_LABELS } from '../consts/stage-config.const';

interface CreationProjectStageCardProps {
  stage: CreationProjectStage;
  isSaving: boolean;
  onUpdateStage: (stage: CreationProjectStage) => Promise<unknown>;
}

export const CreationProjectStageCard: React.FC<CreationProjectStageCardProps> = ({
  stage,
  isSaving,
  onUpdateStage,
}) => {
  const [selected, setSelected] = useState<CreationProjectStage>(stage);
  const [error, setError] = useState<string | null>(null);
  const hasChanged = selected !== stage;

  const handleSave = async () => {
    setError(null);
    try {
      await onUpdateStage(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  return (
    <section className="bg-white border border-[#D9D4CA] rounded-sm p-5 space-y-4">
      <h2 className="font-headline uppercase text-xs tracking-widest text-[#5C697A]">Changer l&apos;étape</h2>
      <label htmlFor="stage-select" className="sr-only">
        Nouvelle étape
      </label>
      <select
        id="stage-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value as CreationProjectStage)}
        disabled={isSaving}
        className="w-full bg-[#F6F2E9] border border-[#D9D4CA] text-[#061938] text-xs py-2 px-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#936C3E] disabled:opacity-50"
      >
        {CREATION_PROJECT_STAGES_ORDER.map((value) => (
          <option key={value} value={value}>
            {ADMIN_CREATION_STAGE_LABELS[value]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={!hasChanged || isSaving}
        className="w-full px-3 py-2 text-[11px] font-headline uppercase tracking-wider rounded-sm bg-[#061938] text-white hover:bg-[#0C2650] disabled:bg-[#D9D4CA] disabled:text-[#8A877F] disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? '…' : 'Enregistrer'}
      </button>
      {error && <p role="alert" className="text-[11px] text-red-600">{error}</p>}
    </section>
  );
};
