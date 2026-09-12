import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useSendMessage } from '../../hooks/useSendMessage';

interface Props {
  activeThreadId: string | null;
}

export const MessageComposer: React.FC<Props> = ({ activeThreadId }) => {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { sendMessage } = useSendMessage();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeThreadId) return;

    setIsSending(true);
    try {
      await sendMessage(activeThreadId, content);
      setContent('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 bg-white border-t border-border">
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 bg-ivory-warm rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-deep-navy/20"
          disabled={!activeThreadId || isSending}
        />
        <button
          type="submit"
          disabled={!content.trim() || !activeThreadId || isSending}
          className="w-12 h-12 rounded-full bg-primary-deep-navy text-white flex items-center justify-center shrink-0 disabled:opacity-50 transition-opacity"
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
};
