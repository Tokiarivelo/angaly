import React from 'react';
import type { TabValue } from '../hooks/useClientSpaceTab';
import { MessageSquare, FileText, Bell } from 'lucide-react';

interface Props {
  currentTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

export const ClientSpaceTabBar: React.FC<Props> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { value: 'messages' as const, label: 'Messages', icon: MessageSquare },
    { value: 'factures' as const, label: 'Factures', icon: FileText },
    { value: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="flex border-b border-border overflow-x-auto hide-scrollbar mb-6">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${
              isActive 
                ? 'text-primary-deep-navy border-b-2 border-primary-deep-navy' 
                : 'text-slate hover:text-primary-deep-navy hover:bg-ivory-warm/50'
            }`}
          >
            <Icon size={18} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
