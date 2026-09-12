import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ConversationThread } from '../../hooks/useConversations';

interface Props {
  threads: ConversationThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export const ConversationThreadList: React.FC<Props> = ({ threads, activeId, onSelect }) => {
  if (threads.length === 0) {
    return <div className="p-4 text-center text-sm text-slate">Aucune conversation</div>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {threads.map(thread => {
        const isActive = thread.id === activeId;
        const dateStr = format(new Date(thread.timestamp), 'dd MMM', { locale: fr });
        return (
          <button
            key={thread.id}
            onClick={() => onSelect(thread.id)}
            className={`flex flex-col p-4 transition-colors text-left ${
              isActive ? 'bg-ivory-warm' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-sm text-primary-deep-navy">
                {thread.atelierName}
              </span>
              <span className="text-xs text-slate whitespace-nowrap">{dateStr}</span>
            </div>
            {thread.orderReference && (
              <span className="text-xs font-mono text-slate mb-1">
                Ref: {thread.orderReference}
              </span>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate line-clamp-1">{thread.lastMessage}</span>
              {thread.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center shrink-0 ml-2">
                  {thread.unreadCount}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
