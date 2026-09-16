'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';

import { useClientSpaceTab } from '../hooks/useClientSpaceTab';
import { useConversations } from '../hooks/useConversations';
import { useConversationThread } from '../hooks/useConversationThread';
import { ClientSpaceTabBar } from './ClientSpaceTabBar';

import { ConversationThreadList } from './messages/ConversationThreadList';
import { ConversationThreadView } from './messages/ConversationThreadView';
import { MessageComposer } from './messages/MessageComposer';

import { InvoiceList } from './factures/InvoiceList';

import { NotificationList } from './notifications/NotificationList';
import { MarkAllReadLink } from './notifications/MarkAllReadLink';

export const MessagesFacturesNotificationsPage = () => {
  const { currentTab, setTab } = useClientSpaceTab();
  const { threads, activeThreadId, setActiveThreadId } = useConversations();
  const { messages } = useConversationThread(activeThreadId);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <ClientSpaceTabBar currentTab={currentTab} onTabChange={setTab} />

      {currentTab === 'messages' && (
        <div className="flex-1 flex overflow-hidden border border-border rounded-2xl bg-white">
          <div className={`w-full md:w-80 md:border-r md:border-border flex-col overflow-y-auto ${activeThreadId ? 'hidden md:flex' : 'flex'}`}>
            <ConversationThreadList threads={threads} activeId={activeThreadId} onSelect={setActiveThreadId} />
          </div>

          <div className={`flex-1 flex-col ${activeThreadId ? 'flex' : 'hidden md:flex'}`}>
            {activeThreadId && (
              <button
                onClick={() => setActiveThreadId(null)}
                className="md:hidden flex items-center gap-2 p-4 border-b border-border text-sm text-primary-deep-navy"
              >
                <ChevronLeft size={18} />
                Retour aux conversations
              </button>
            )}
            <ConversationThreadView messages={messages} />
            <MessageComposer activeThreadId={activeThreadId} />
          </div>
        </div>
      )}

      {currentTab === 'factures' && (
        <div className="flex-1 overflow-y-auto pb-12">
          <InvoiceList />
        </div>
      )}

      {currentTab === 'notifications' && (
        <div className="flex-1 overflow-y-auto pb-12">
          <div className="flex justify-end mb-4">
            <MarkAllReadLink />
          </div>
          <NotificationList />
        </div>
      )}
    </div>
  );
};
