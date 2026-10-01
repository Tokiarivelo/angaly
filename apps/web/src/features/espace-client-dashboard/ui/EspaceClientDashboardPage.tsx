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

export const EspaceClientDashboardPage: React.FC = () => {
  const data = useDashboardSummary();
  const { activities } = useRecentActivity();

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Greeting Header */}
      <WelcomeHeader firstName={data.firstName} />

      {/* Main Dashboard Canvas */}
      <div className="p-6 sm:p-8 lg:p-12 space-y-10 lg:space-y-12 max-w-7xl mx-auto w-full flex-1">
        {/* Summary Row - 4 Cards */}
        <section aria-label="Résumé de votre compte">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            <NextAppointmentCard appointment={data.nextAppointment} />
            <CurrentOrderCard order={data.currentOrder} />
            <PremiumProjectCard project={data.premiumProject} />
            <NotificationsPreviewCard notifications={data.notifications} />
          </div>
        </section>

        {/* Middle Section - Accès Rapide (2/3) & Activité Récente (1/3) */}
        <section aria-label="Accès rapide et activité récente" className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-stretch">
          {/* Quick Access Tiles (2 columns) */}
          <div className="lg:col-span-2 flex flex-col">
            <h2 className="font-heading text-2xl text-angaly-navy mb-6 font-normal">
              Accès Rapide
            </h2>
            <div className="flex-1">
              <QuickAccessTilesGrid />
            </div>
          </div>

          {/* Recent Activity Timeline (1 column) */}
          <div className="lg:col-span-1 flex flex-col">
            <h2 className="font-heading text-2xl text-angaly-navy mb-6 font-normal">
              Activité récente
            </h2>
            <div className="flex-1">
              <RecentActivityTimeline activities={activities} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
