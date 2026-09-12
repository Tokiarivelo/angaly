import React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

interface NotificationsPreviewCardProps {
  notifications?: any[];
}

export const NotificationsPreviewCard: React.FC<NotificationsPreviewCardProps> = ({ notifications = [] }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ivory-warm rounded-full flex items-center justify-center text-primary-deep-navy">
            <Bell size={20} />
          </div>
          <h2 className="font-serif text-lg text-primary-deep-navy">Notifications</h2>
        </div>
        {notifications.length > 0 && (
          <span className="w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-4">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate text-center mt-4">Aucune nouvelle notification.</p>
        ) : (
          notifications.map((notif, i) => (
            <div key={i} className="flex gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-primary-deep-navy shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary-deep-navy">{notif.title}</p>
                <p className="text-xs text-slate mt-1 line-clamp-2">{notif.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/mes-messages?tab=notifications" className="mt-6 text-sm font-medium text-primary-deep-navy hover:underline underline-offset-4">
        Toutes les notifications &rarr;
      </Link>
    </div>
  );
};
