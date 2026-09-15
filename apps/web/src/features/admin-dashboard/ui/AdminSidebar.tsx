'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Sparkles, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

const navItems = [
  { label: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Paramètres IA', href: '/admin/ai-settings', icon: Sparkles },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block border-r border-border min-h-[calc(100vh-4rem)] p-6 bg-white">
      <p className="px-4 mb-4 text-xs uppercase tracking-wider text-slate font-semibold">
        Administration
      </p>
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
