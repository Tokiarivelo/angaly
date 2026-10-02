'use client';

import React, { useState } from 'react';
import type { CreationProjectAssigneeDto } from '@angaly/types';
import { ADMIN_STAFF_ROLE_LABELS } from '../consts/stage-config.const';

interface CreationProjectAssigneeCardProps {
  current: CreationProjectAssigneeDto | null | undefined;
  assignees: CreationProjectAssigneeDto[];
  isSaving: boolean;
  onAssign: (userId: string | null) => Promise<unknown>;
}

export const CreationProjectAssigneeCard: React.FC<CreationProjectAssigneeCardProps> = ({
  current,
  assignees,
  isSaving,
  onAssign,
}) => {
  const [selected, setSelected] = useState<string>(current?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const hasChanged = selected !== (current?.id ?? '');

  const handleAssign = async () => {
    setError(null);
    try {
      await onAssign(selected === '' ? null : selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'assignation");
    }
  };

  return (
    <section className="bg-white border border-[#D9D4CA] rounded-sm p-5 space-y-4">
      <h2 className="font-headline uppercase text-xs tracking-widest text-[#5C697A]">Couturière assignée</h2>
      <p className="text-sm text-[#061938]">{current ? current.email : 'Non assignée'}</p>

      <label htmlFor="assignee-select" className="sr-only">
        Choisir un membre de l&apos;atelier
      </label>
      <select
        id="assignee-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={isSaving}
        className="w-full bg-[#F6F2E9] border border-[#D9D4CA] text-[#061938] text-xs py-2 px-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#936C3E] disabled:opacity-50"
      >
        <option value="">Non assignée</option>
        {assignees.map((member) => (
          <option key={member.id} value={member.id}>
            {member.email} — {ADMIN_STAFF_ROLE_LABELS[member.role] ?? member.role}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => void handleAssign()}
        disabled={!hasChanged || isSaving}
        className="w-full px-3 py-2 text-[11px] font-headline uppercase tracking-wider rounded-sm bg-[#061938] text-white hover:bg-[#0C2650] disabled:bg-[#D9D4CA] disabled:text-[#8A877F] disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? '…' : 'Assigner'}
      </button>
      {error && <p role="alert" className="text-[11px] text-red-600">{error}</p>}
    </section>
  );
};
