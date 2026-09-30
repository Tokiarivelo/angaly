'use client';

import React from 'react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import { useIsStaff } from '../hooks/useIsStaff';
import { ClientSpaceSidebar } from './ClientSpaceSidebar';

export const ClientSpaceLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isStaff = useIsStaff();

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      <ClientSpaceSidebar />
      
      <div className="lg:hidden flex items-center justify-between border-b border-border bg-white px-4 py-3">
        <Link href={ROUTES.home} className="text-sm font-medium text-angaly-slate hover:text-angaly-navy">
          ← Retour au site
        </Link>
        {isStaff && (
          <Link href={ROUTES.backOffice} className="text-sm font-medium text-angaly-navy">
            Back-office →
          </Link>
        )}
      </div>
      
      <main className="flex-1 bg-angaly-ivory p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
