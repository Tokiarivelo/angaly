import React from 'react';
import type { CreationProjectStageEventDto } from '@angaly/types';
import { formatDate } from '@/lib/utils';
import { ADMIN_CREATION_STAGE_LABELS } from '../consts/stage-config.const';

interface CreationProjectHistoryProps {
  events: CreationProjectStageEventDto[];
}

export const CreationProjectHistory: React.FC<CreationProjectHistoryProps> = ({ events }) => {
  if (events.length === 0) {
    return <p className="text-sm text-[#8A877F]">Aucun changement d&apos;étape enregistré.</p>;
  }

  return (
    <ol className="relative border-l border-[#D9D4CA] ml-2 space-y-5">
      {events.map((event) => (
        <li key={event.id} className="pl-5 relative">
          <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#936C3E]" aria-hidden="true" />
          <p className="text-sm text-[#061938]">
            {event.fromStage ? `${ADMIN_CREATION_STAGE_LABELS[event.fromStage]} → ` : ''}
            <span className="font-semibold">{ADMIN_CREATION_STAGE_LABELS[event.toStage]}</span>
          </p>
          <p className="text-[11px] text-[#8A877F]">
            {formatDate(event.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}
            {event.changedByEmail ? ` · ${event.changedByEmail}` : ''}
          </p>
        </li>
      ))}
    </ol>
  );
};
