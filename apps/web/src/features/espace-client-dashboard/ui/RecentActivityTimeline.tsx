import React from 'react';
import Link from 'next/link';

export interface RecentActivityTimelineItem {
  date: string;
  title: string;
  description: string;
}

interface RecentActivityTimelineProps {
  activities?: RecentActivityTimelineItem[];
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({ activities = [] }) => {
  return (
    <div className="bg-white border border-angaly-border p-6 sm:p-8 h-full flex flex-col justify-between">
      <div>
        {activities.length === 0 ? (
          <p className="text-xs text-angaly-slate text-center py-8">Aucune activité récente.</p>
        ) : (
          <div className="relative border-l border-angaly-warm-ivory ml-2 space-y-6 sm:space-y-8">
            {activities.slice(0, 4).map((act, i) => (
              <div key={`${act.date}-${i}`} className="relative pl-6">
                <span
                  className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border-2 border-white ${
                    i === 0 ? 'bg-angaly-champagne' : 'bg-angaly-warm-ivory'
                  }`}
                />
                <p className="font-sans text-xs sm:text-sm text-angaly-navy font-medium leading-tight">
                  {act.title}
                </p>
                <p className="text-[11px] text-angaly-warm-gray mt-1">
                  {act.date}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-angaly-border text-center">
        <Link
          href="/mes-rendez-vous"
          className="text-xs font-sans tracking-wider uppercase text-angaly-soft-navy hover:text-angaly-champagne transition-colors font-medium"
        >
          Voir tout l'historique
        </Link>
      </div>
    </div>
  );
};
