'use client';

import React from 'react';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useRecentActivity } from '../hooks/useRecentActivity';
import { WelcomeHeader } from './WelcomeHeader';
import { NextAppointmentCard } from './NextAppointmentCard';
import { CurrentOrderCard } from './CurrentOrderCard';
import { PremiumProjectCard } from './PremiumProjectCard';
import { NotificationsPreviewCard } from './NotificationsPreviewCard';
import { QuickAccessTilesGrid } from './QuickAccessTilesGrid';
import { RecentActivityTimeline } from './RecentActivityTimeline';

export const EspaceClientDashboardPage = () => {
  const data = useDashboardSummary();
  const { activities } = useRecentActivity();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <WelcomeHeader firstName={data.firstName} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-1">
          <NextAppointmentCard appointment={data.nextAppointment} />
        </div>
        <div className="lg:col-span-2">
          {data.premiumProject ? (
            <PremiumProjectCard project={data.premiumProject} />
          ) : (
            <CurrentOrderCard order={data.currentOrder} />
          )}
        </div>
        <div className="lg:col-span-1">
          <NotificationsPreviewCard notifications={data.notifications} />
        </div>
      </div>

      <div className="pt-4">
        <h2 className="font-serif text-xl text-primary-deep-navy mb-4">Accès rapide</h2>
        <QuickAccessTilesGrid />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="lg:col-span-2">
          {/* Main content area for future use, maybe a larger widget or graph */}
          <div className="bg-white rounded-2xl border border-border p-8 h-full min-h-[300px] flex items-center justify-center">
            <p className="text-slate text-center">Espace réservé pour les suggestions personnalisées ou la galerie d'inspiration.</p>
          </div>
        </div>
        <div className="lg:col-span-1">
          <RecentActivityTimeline activities={activities} />
        </div>
      </div>
    </div>
  );
};
