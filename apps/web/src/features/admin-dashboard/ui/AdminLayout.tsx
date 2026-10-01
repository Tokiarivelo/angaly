'use client';

import React from 'react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import { AdminSidebar } from './AdminSidebar';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-angaly-ivory">
      <AdminSidebar />
      <div className="lg:hidden flex items-center justify-between border-b border-[#18375D] bg-[#061938] px-5 py-3.5 text-xs uppercase tracking-wider font-sans font-medium">
        <Link href={ROUTES.home} className="text-angaly-warm-ivory hover:text-angaly-champagne transition-colors">
          ← Retour au site
        </Link>
        <Link href={ROUTES.compte} className="text-angaly-champagne hover:text-angaly-ivory transition-colors">
          Espace client →
        </Link>
      </div>
      <main className="flex-1 bg-angaly-ivory p-6 md:p-10 overflow-y-auto">{children}</main>
    </div>
  );
};
