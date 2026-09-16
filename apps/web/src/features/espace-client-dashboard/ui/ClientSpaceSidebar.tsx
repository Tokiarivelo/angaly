'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  ShoppingBag, 
  Scissors, 
  Layers, 
  Ruler, 
  Heart, 
  MessageSquare, 
  FileText, 
  Bell, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const navItems = [
  { label: 'Tableau de bord', href: '/espace-client', icon: LayoutDashboard },
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

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block border-r border-border min-h-[calc(100vh-4rem)] p-6 bg-white">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-primary-deep-navy text-white' 
                  : 'text-slate hover:bg-ivory-warm hover:text-primary-deep-navy'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
        
        <button
          onClick={() => void signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left transition-colors mt-8"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </nav>
    </aside>
  );
};
