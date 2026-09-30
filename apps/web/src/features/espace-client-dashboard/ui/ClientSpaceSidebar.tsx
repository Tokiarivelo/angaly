'use client';

import React from 'react';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Bell,
  Calendar,
  FileText,
  Heart,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Ruler,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

import { ROUTES } from '@/lib/routes';

import { useIsStaff } from '../hooks/useIsStaff';

const navItems = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Mes rendez-vous', href: '/mes-rendez-vous', icon: Calendar },
  { label: 'Mes commandes', href: '/mes-commandes', icon: ShoppingBag },
  { label: 'Mes créations', href: '/creations', icon: Scissors },
  { label: 'Mes projets de patron', href: '/mes-projets-patron', icon: Layers },
  { label: 'Mes mesures', href: '/mes-mesures', icon: Ruler },
  { label: 'Mes favoris', href: '/mes-favoris', icon: Heart },
  { label: 'Mes messages', href: '/mes-messages?tab=messages', icon: MessageSquare },
  { label: 'Mes factures', href: '/mes-messages?tab=factures', icon: FileText },
  { label: 'Notifications', href: '/mes-messages?tab=notifications', icon: Bell },
  { label: 'Paramètres', href: '/parametres', icon: Settings },
];

export const ClientSpaceSidebar = () => {
  const pathname = usePathname();
  const isStaff = useIsStaff();

  return (
    <aside className="border-border hidden min-h-[calc(100vh-4rem)] w-64 flex-shrink-0 border-r bg-white p-6 lg:block">
      <nav className="space-y-1">
        <Link
          href={ROUTES.home}
          className="text-angaly-slate border-border hover:bg-angaly-ivory hover:text-angaly-navy mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
        >
          <Home size={18} />
          Retour au site
        </Link>
        {isStaff && (
          <Link
            href={ROUTES.backOffice}
            className="bg-angaly-navy mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <ShieldCheck size={18} />
            Back-office
          </Link>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-angaly-navy text-white'
                  : 'text-angaly-slate hover:bg-angaly-ivory hover:text-angaly-navy'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}

        <button
          onClick={() => void signOut()}
          className="mt-8 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </nav>
    </aside>
  );
};
