'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Bell,
  Calendar,
  Compass,
  FileText,
  Heart,
  Home,
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
  { label: 'Tableau de bord', href: ROUTES.compte, icon: LayoutDashboard },
  { label: 'Mes rendez-vous', href: '/mes-rendez-vous', icon: Calendar },
  { label: 'Mes commandes', href: '/suivi-commande', icon: ShoppingBag },
  { label: 'Mes créations', href: ROUTES.mesCreations, icon: Scissors },
  { label: 'Projets de patron', href: '/mes-projets-patron', icon: Compass },
  { label: 'Mes mesures', href: '/mes-mesures', icon: Ruler },
  { label: 'Mes favoris', href: '/mes-favoris', icon: Heart },
  { label: 'Mes messages', href: '/mes-messages?tab=messages', icon: MessageSquare },
  { label: 'Mes factures', href: '/mes-messages?tab=factures', icon: FileText },
  { label: 'Notifications', href: '/mes-messages?tab=notifications', icon: Bell },
  { label: 'Paramètres', href: '/parametres', icon: Settings },
];

export const ClientSpaceSidebar: React.FC = () => {
  const pathname = usePathname();
  const isStaff = useIsStaff();
  const { data: session } = useSession();

  const userName = session?.user?.name || 'Marie D.';
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'M';

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen bg-[#061938] border-r border-[#18375D] z-50 py-8 select-none">
      {/* Brand Logo Header */}
      <div className="px-6 mb-8">
        <Link href={ROUTES.home} className="block group">
          <h1 className="font-heading text-2xl tracking-[0.2em] text-[#F6F2E9] uppercase group-hover:text-angaly-champagne transition-colors">
            ANGALY
          </h1>
          <p className="font-sans text-xs tracking-widest text-angaly-champagne uppercase mt-1 opacity-80">
            Haute Couture
          </p>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-0 [scrollbar-width:thin] [scrollbar-color:#18375D_#061938]">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === ROUTES.compte && (pathname === '/espace-client' || pathname === '/dashboard'));
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`px-6 py-3.5 flex items-center gap-4 font-sans text-sm tracking-wide uppercase font-medium duration-300 ease-in-out w-full border-l-2 ${
                    isActive
                      ? 'text-[#C5B190] bg-[#0C2650] border-[#936C3E]'
                      : 'text-[#D8D3C8] hover:bg-[#0C2650] hover:text-[#C5B190] border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[#C5B190]' : 'text-[#D8D3C8]'} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Profile & Logout */}
      <div className="mt-auto px-6 pt-6 border-t border-[#18375D]">
        {isStaff && (
          <div className="mb-4">
            <Link
              href={ROUTES.backOffice}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-xs tracking-wider uppercase font-medium text-angaly-champagne bg-angaly-navy-blue/80 hover:bg-angaly-navy-blue border border-angaly-gold/30 transition-colors w-full"
            >
              <ShieldCheck size={15} />
              <span>Accès Back-office</span>
            </Link>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full border border-angaly-champagne bg-[#0C2650] flex items-center justify-center text-angaly-champagne font-heading text-sm font-semibold shrink-0">
            {userInitial}
          </div>
          <div className="overflow-hidden">
            <p className="text-[#F6F2E9] font-heading text-sm tracking-wide truncate">
              {userName}
            </p>
            <p className="text-angaly-champagne font-sans text-xs truncate">
              Cliente Privilège
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-[#18375D]/40">
          <Link
            href={ROUTES.home}
            className="text-[#D8D3C8]/70 hover:text-[#C5B190] flex items-center gap-3 transition-colors font-sans text-xs tracking-wide uppercase w-full"
          >
            <Home size={15} />
            <span>Retour au site</span>
          </Link>

          <button
            onClick={() => void signOut()}
            className="text-[#D8D3C8] hover:text-[#C5B190] flex items-center gap-3 transition-colors font-sans text-xs tracking-wide uppercase w-full text-left"
          >
            <LogOut size={15} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
