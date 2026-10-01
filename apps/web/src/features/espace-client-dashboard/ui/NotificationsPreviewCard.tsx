import React from 'react';
import Link from 'next/link';
import { Bell, Mail, FileText, ArrowRight } from 'lucide-react';

export interface NotificationsPreviewItem {
  id: string;
  title: string;
  message: string;
}

interface NotificationsPreviewCardProps {
  notifications?: NotificationsPreviewItem[];
}

export const NotificationsPreviewCard: React.FC<NotificationsPreviewCardProps> = ({ notifications = [] }) => {
  return (
    <div className="bg-white border border-angaly-border p-6 flex flex-col justify-between hover:border-angaly-champagne transition-colors duration-300 h-full min-h-[220px]">
      <div className="flex justify-between items-center mb-3.5 border-b border-angaly-border pb-2.5">
        <h3 className="font-heading text-base text-angaly-navy font-medium">Notifications</h3>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-angaly-error/15 text-angaly-error text-[10px] font-sans font-semibold flex items-center justify-center">
              {notifications.length}
            </span>
          )}
          <Bell size={16} className="text-angaly-warm-gray" />
        </div>
      </div>

      <div className="flex-1 space-y-3.5 my-auto">
        {notifications.length === 0 ? (
          <p className="text-xs text-angaly-slate text-center py-4">Aucune nouvelle notification.</p>
        ) : (
          notifications.slice(0, 2).map((notif, index) => {
            const Icon = index % 2 === 0 ? Mail : FileText;
            return (
              <div key={notif.id} className="flex gap-2.5 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-angaly-error mt-1.5 shrink-0" />
                <Icon size={14} className="text-angaly-champagne mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-angaly-navy font-medium leading-tight truncate">
                    {notif.title}
                  </p>
                  <p className="text-[11px] text-angaly-warm-gray mt-0.5 truncate">
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Link
        href="/mes-messages?tab=notifications"
        className="mt-4 pt-3 border-t border-angaly-border/50 text-xs font-sans tracking-wider uppercase text-angaly-soft-navy hover:text-angaly-navy flex items-center gap-1 font-medium transition-colors"
      >
        <span>Toutes les notifications</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
};
