'use client';

import React from 'react';
import { useClientSpaceTab } from '../hooks/useClientSpaceTab';
import { ClientSpaceTabBar } from './ClientSpaceTabBar';

import { useConversations } from '../hooks/useConversations';
import { useConversationThread } from '../hooks/useConversationThread';
import { ConversationThreadList } from './messages/ConversationThreadList';
import { ConversationThreadView } from './messages/ConversationThreadView';
import { MessageComposer } from './messages/MessageComposer';

import { InvoiceList } from './factures/InvoiceList';

import { NotificationList } from './notifications/NotificationList';
import { MarkAllReadLink } from './notifications/MarkAllReadLink';

export const MessagesFacturesNotificationsPage = () => {
  const { currentTab, setTab } = useClientSpaceTab();

  // Messages state
  const { threads, activeThreadId, setActiveThreadId } = useConversations();
  const { messages } = useConversationThread(activeThreadId);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <ClientSpaceTabBar currentTab={currentTab} onTabChange={setTab} />

      {currentTab === 'messages' && (
        <div className="flex-1 flex flex-col md:flex-row bg-white border border-border rounded-2xl overflow-hidden min-h-0">
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border flex flex-col overflow-y-auto">
            <ConversationThreadList 
              threads={threads} 
              activeId={activeThreadId} 
              onSelect={setActiveThreadId} 
            />
          </div>
          <div className="w-full md:w-2/3 flex flex-col min-h-0">
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
