import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import type { Message } from '../../hooks/useConversationThread';

interface Props {
  messages: Message[];
}

export const ConversationThreadView: React.FC<Props> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate">
        <p>Sélectionnez une conversation ou envoyez un nouveau message.</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((msg) => {
        const isClient = msg.sender === 'client';
        const timeStr = format(new Date(msg.timestamp), 'HH:mm');
        
        return (
          <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl p-4 ${
              isClient 
                ? 'bg-primary-deep-navy text-white rounded-tr-sm' 
                : 'bg-ivory-warm text-primary-deep-navy rounded-tl-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-[10px] mt-2 text-right ${isClient ? 'text-white/70' : 'text-slate'}`}>
                {timeStr}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
