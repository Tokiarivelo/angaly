'use client';

import React from 'react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import { AdminSidebar } from './AdminSidebar';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <div className="lg:hidden flex items-center justify-between border-b border-border bg-white px-4 py-3 text-sm font-medium">
        <Link href={ROUTES.home} className="text-angaly-slate hover:text-angaly-navy">
          ← Retour au site
        </Link>
        <Link href={ROUTES.compte} className="text-angaly-navy">
          Espace client →
        </Link>
      </div>
      <main className="flex-1 bg-angaly-ivory p-4 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
};
