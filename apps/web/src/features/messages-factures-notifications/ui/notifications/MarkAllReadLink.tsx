import React, { useState } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { useMarkNotificationsRead } from '../../hooks/useMarkNotificationsRead';

export const MarkAllReadLink: React.FC = () => {
  const [isMarking, setIsMarking] = useState(false);
  const { markAllRead } = useMarkNotificationsRead();

  const handleMarkAll = async () => {
    setIsMarking(true);
    try {
      await markAllRead();
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <button
      onClick={handleMarkAll}
      disabled={isMarking}
      className="flex items-center gap-2 text-sm font-medium text-primary-deep-navy hover:underline disabled:opacity-50"
    >
      {isMarking ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
      Tout marquer comme lu
    </button>
  );
};
