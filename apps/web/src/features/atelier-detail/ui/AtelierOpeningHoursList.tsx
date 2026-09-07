import type { AtelierOpeningHours } from '@angaly/types';

import { buildOpeningHoursSchedule } from '../utils/buildOpeningHoursSchedule';

/** Real screen's "Horaires d'Ouverture": every day listed, "Fermé" shown explicitly (not omitted). */
export function AtelierOpeningHoursList({ openingHours }: { openingHours: AtelierOpeningHours }) {
  const rows = buildOpeningHoursSchedule(openingHours);

  return (
    <div>
      <h3 className="font-heading mb-4 text-2xl text-angaly-navy">Horaires d&apos;Ouverture</h3>
      <ul className="text-sm text-angaly-slate">
        {rows.map((row, index) => (
          <li
            key={row.label}
            className={`flex justify-between py-2 ${
              index < rows.length - 1 ? 'border-b border-angaly-border/50' : ''
            } ${row.isClosed ? 'text-angaly-warm-gray' : ''}`}
          >
            <span>{row.label}</span>
            <span>{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
