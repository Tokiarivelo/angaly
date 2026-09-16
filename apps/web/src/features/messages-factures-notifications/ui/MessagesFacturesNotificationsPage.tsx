'use client';

import React from 'react';
import { useClientSpaceTab } from '../hooks/useClientSpaceTab';
import { ClientSpaceTabBar } from './ClientSpaceTabBar';

import { MessagingComingSoonPanel } from './messages/MessagingComingSoonPanel';

import { InvoiceList } from './factures/InvoiceList';

import { NotificationList } from './notifications/NotificationList';
import { MarkAllReadLink } from './notifications/MarkAllReadLink';

export const MessagesFacturesNotificationsPage = () => {
  const { currentTab, setTab } = useClientSpaceTab();

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <ClientSpaceTabBar currentTab={currentTab} onTabChange={setTab} />

      {currentTab === 'messages' && <MessagingComingSoonPanel />}

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
