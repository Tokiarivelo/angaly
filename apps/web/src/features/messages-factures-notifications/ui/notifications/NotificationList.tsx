import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Package, MessageSquare, Bell, Calendar } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationList: React.FC = () => {
  const { notifications } = useNotifications();

  if (notifications.length === 0) {
    return (
      <div className="p-12 text-center text-slate bg-white rounded-2xl border border-border flex flex-col items-center">
        <Bell size={32} className="mb-4 opacity-50" />
        <p>Vous n'avez aucune notification.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_STATUS_CHANGED': return <Package size={20} />;
      case 'MESSAGE_RECEIVED': return <MessageSquare size={20} />;
      case 'APPOINTMENT_REMINDER': return <Calendar size={20} />;
      default: return <Bell size={20} />;
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden divide-y divide-border">
      {notifications.map((notif) => (
        <div 
          key={notif.id} 
          className={`flex gap-4 p-6 transition-colors ${notif.isRead ? 'opacity-70 hover:opacity-100 bg-white' : 'bg-ivory-warm/30'}`}
        >
          <div className="relative shrink-0 mt-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              notif.isRead ? 'bg-ivory-warm text-slate' : 'bg-primary-deep-navy text-white'
            }`}>
              {getIcon(notif.type)}
            </div>
            {!notif.isRead && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start gap-4">
              <h3 className={`text-sm font-medium ${notif.isRead ? 'text-slate' : 'text-primary-deep-navy'}`}>
                {notif.title}
              </h3>
              <span className="text-xs text-slate whitespace-nowrap shrink-0">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
              </span>
            </div>
            <p className="text-sm text-slate mt-1">{notif.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
