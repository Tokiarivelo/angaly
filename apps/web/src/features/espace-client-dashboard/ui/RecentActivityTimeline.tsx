import React from 'react';

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
    <div className="bg-white p-6 rounded-2xl border border-border">
      <h2 className="font-serif text-xl text-primary-deep-navy mb-6">Activité récente</h2>

      {activities.length === 0 ? (
        <p className="text-sm text-slate text-center py-4">Aucune activité récente.</p>
      ) : (
        <div className="relative pl-4 border-l border-border space-y-8">
          {activities.map((act, i) => (
            <div key={`${act.date}-${i}`} className="relative">
              <div className="absolute -left-[21px] mt-1.5 w-2.5 h-2.5 rounded-full bg-primary-deep-navy ring-4 ring-white" />
              <p className="text-xs text-slate mb-1">{act.date}</p>
              <p className="text-sm font-medium text-primary-deep-navy">{act.title}</p>
              <p className="text-sm text-slate mt-1">{act.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
