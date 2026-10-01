'use client';

import React from 'react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';
import { useIsStaff } from '../hooks/useIsStaff';
import { ClientSpaceSidebar } from './ClientSpaceSidebar';

export const ClientSpaceLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isStaff = useIsStaff();

  return (
    <div className="min-h-screen bg-angaly-ivory lg:pl-64 flex flex-col">
      {/* Desktop Sidebar (Fixed left) */}
      <ClientSpaceSidebar />

      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between border-b border-angaly-royal-navy bg-angaly-navy px-5 py-3.5 z-30">
        <Link href={ROUTES.home} className="flex flex-col">
          <span className="font-heading text-lg tracking-[0.2em] text-angaly-ivory uppercase leading-none">
            ANGALY
          </span>
          <span className="font-sans text-[8px] tracking-[0.25em] text-angaly-champagne uppercase mt-0.5 opacity-80 leading-none">
            Haute Couture
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.home}
            className="text-xs font-sans uppercase tracking-wider text-angaly-warm-ivory hover:text-angaly-champagne transition-colors"
          >
            Site public
          </Link>
          {isStaff && (
            <Link
              href={ROUTES.backOffice}
              className="text-xs font-sans uppercase tracking-wider text-angaly-champagne bg-angaly-navy-blue px-2.5 py-1 rounded border border-angaly-gold/30"
            >
              Back-office
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <main className="flex-1">
          {children}
        </main>

        {/* Minimal Couture Footer */}
        <footer className="mt-auto border-t border-angaly-border bg-angaly-ivory py-6 px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 max-w-7xl mx-auto w-full">
            <p className="text-xs text-angaly-warm-gray font-sans tracking-wide">
              © {new Date().getFullYear()} ANGALY Haute Couture.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href={ROUTES.contact}
                className="text-xs text-angaly-slate hover:text-angaly-navy font-sans tracking-wide transition-colors"
              >
                Besoin d'aide ?
              </Link>
              <Link
                href={ROUTES.contact}
                className="text-xs text-angaly-slate hover:text-angaly-navy font-sans tracking-wide transition-colors"
              >
                Support
              </Link>
              <Link
                href="/mentions-legales"
                className="text-xs text-angaly-slate hover:text-angaly-navy font-sans tracking-wide transition-colors"
              >
                Mentions Légales
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
