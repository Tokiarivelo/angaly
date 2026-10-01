'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Scissors, Check, Loader2 } from 'lucide-react';
import {
  type CreationProjectDto,
  CREATION_PROJECT_STAGES_ORDER,
  type CreationProjectStage,
} from '@angaly/types';
import {
  ADMIN_CREATION_STAGE_BADGE_CLASSES,
  ADMIN_CREATION_STAGE_LABELS,
} from '../consts/stage-config.const';
import { formatDate } from '@/lib/utils';

interface CreationProjectRowProps {
  project: CreationProjectDto;
  onUpdateStage: (id: string, stage: CreationProjectStage) => Promise<unknown>;
  isSaving: boolean;
}

export const CreationProjectRow: React.FC<CreationProjectRowProps> = ({
  project,
  onUpdateStage,
  isSaving,
}) => {
  const [selectedStage, setSelectedStage] = useState<CreationProjectStage>(project.stage);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasChanged = selectedStage !== project.stage;

  const handleSave = async () => {
    if (!hasChanged || isSaving) return;
    setErrorMsg(null);
    setSaveSuccess(false);
    try {
      await onUpdateStage(project.id, selectedStage);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const badgeClass =
    ADMIN_CREATION_STAGE_BADGE_CLASSES[project.stage] ??
    'bg-[#5C697A]/10 text-[#5C697A] border-[#5C697A]/20';

  const customerLabel = project.customerName
    ? `Client : ${project.customerName}`
    : (project.description ?? 'Client sur mesure');

  return (
    <tr className="hover:bg-[#F6F2E9]/40 transition-colors">
      {/* Référence */}
      <td className="py-4 px-6 font-mono text-[#5C697A] font-medium text-xs whitespace-nowrap">
        {project.reference}
      </td>

      {/* Création */}
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-12 bg-[#D8D3C8] shrink-0 border border-[#D9D4CA] flex items-center justify-center text-[#5C697A]"
            aria-hidden="true"
          >
            <Scissors size={18} className="text-[#8A877F]" />
          </div>
          <div className="min-w-0">
            <p className="font-headline font-bold text-[#061938] text-sm truncate max-w-xs md:max-w-md">
              {project.title}
            </p>
            <p className="text-[#8A877F] text-[11px] truncate max-w-xs md:max-w-md">
              {customerLabel}
            </p>
          </div>
        </div>
      </td>

      {/* Devis */}
      <td className="py-4 px-6 font-mono text-xs whitespace-nowrap">
        {project.quoteNumber ? (
          <Link
            href={`/devis/${project.quoteNumber}`}
            target="_blank"
            className="text-[#061938] hover:text-[#936C3E] underline decoration-dotted underline-offset-2 transition-colors"
            title="Consulter le devis"
          >
            {project.quoteNumber}
          </Link>
        ) : (
          <span className="text-[#8A877F]">—</span>
        )}
      </td>

      {/* Ouvert le */}
      <td className="py-4 px-6 text-[#5C697A] text-xs whitespace-nowrap">
        {formatDate(project.createdAt, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </td>

      {/* Étape Badge */}
      <td className="py-4 px-6 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-1 text-[10px] font-headline uppercase tracking-wider font-semibold border ${badgeClass}`}
        >
          {ADMIN_CREATION_STAGE_LABELS[project.stage]}
        </span>
      </td>

      {/* Action: Select + Button */}
      <td className="py-4 px-6 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          <label htmlFor={`stage-select-${project.id}`} className="sr-only">
            Changer l&apos;étape pour {project.reference}
          </label>
          <select
            id={`stage-select-${project.id}`}
            aria-label={`Étape pour ${project.reference}`}
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as CreationProjectStage)}
            disabled={isSaving}
            className="bg-[#F6F2E9] border border-[#D9D4CA] text-[#061938] text-xs py-1 px-2 focus:outline-none focus:ring-1 focus:ring-[#936C3E] rounded-sm disabled:opacity-50"
          >
            {CREATION_PROJECT_STAGES_ORDER.map((stage) => (
              <option key={stage} value={stage}>
                {ADMIN_CREATION_STAGE_LABELS[stage]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!hasChanged || isSaving}
            aria-label={`Enregistrer l'étape de ${project.reference}`}
            className={`px-3 py-1 text-[11px] font-headline uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5 ${
              saveSuccess
                ? 'bg-[#46745A] text-white'
                : hasChanged
                  ? 'bg-[#061938] text-white hover:bg-[#0C2650]'
                  : 'bg-[#D9D4CA] text-[#8A877F] cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check size={12} />
                <span>Enregistré</span>
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>

        {errorMsg && (
          <p className="text-[10px] text-red-600 mt-1 text-right">{errorMsg}</p>
        )}
      </td>
    </tr>
  );
};
