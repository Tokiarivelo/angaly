'use client';

import React from 'react';
import { WelcomeHeader } from './WelcomeHeader';
import { NextAppointmentCard } from './NextAppointmentCard';
import { CurrentOrderCard } from './CurrentOrderCard';
import { PremiumProjectCard } from './PremiumProjectCard';
import { NotificationsPreviewCard } from './NotificationsPreviewCard';
import { QuickAccessTilesGrid } from './QuickAccessTilesGrid';
import { RecentActivityTimeline } from './RecentActivityTimeline';

// Mock hook since backend isn't ready
const useDashboardSummary = () => {
  return {
    firstName: 'Toki',
    nextAppointment: { id: 1 },
    currentOrder: { id: 'ANG-2938' },
    premiumProject: null,
    notifications: [
      { title: 'Commande expédiée', message: 'Votre commande #ANG-2938 est en route.' },
      { title: 'Nouveau message', message: 'La couturière a répondu à votre question.' }
    ],
    recentActivities: [
      { date: 'Hier à 14:30', title: 'Rendez-vous confirmé', description: 'Atelier ANGALY Analakely' },
      { date: 'Le 20 Septembre', title: 'Commande #ANG-2938 passée', description: 'Pour un montant de 150 000 MGA' },
    ],
  };
};

export const EspaceClientDashboardPage = () => {
  const data = useDashboardSummary();

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
          <RecentActivityTimeline activities={data.recentActivities} />
        </div>
      </div>
    </div>
  );
};
