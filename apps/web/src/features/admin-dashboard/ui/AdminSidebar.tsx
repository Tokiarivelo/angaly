'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Sparkles, FileEdit, Image as ImageIcon, LogOut, Home, UserRound, Scissors } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

import { Role } from '@angaly/types';

import { ROUTES } from '@/lib/routes';

// NB: `(admin)` is a Next.js route group — it adds no URL segment, so these
// pages' real URLs have no `/admin` prefix (`/dashboard`, `/ai-settings`,
// ...) even though docs/pages/*.md describe them as `/admin/...` — see the
// routing note in docs/pages/admin-gestion-contenu.md "Points d'attention".
// Fixed here (this file) since all 4 links live together; the matching
// internal `redirect('/admin/dashboard')` inside
// admin-ai-settings/.../ai-settings/page.tsx (Phase 5, not touched by this
// session) still has the stale prefix and should be corrected the next time
// that file is edited.
const STAFF: Role[] = [Role.COUTURIERE, Role.MANAGER, Role.ADMIN];
const CONTENT: Role[] = [Role.MANAGER, Role.ADMIN];

// `roles` mirrors each page's own server-side gate (apps/web/src/app/(admin)/*/page.tsx),
// which silently redirects to /dashboard — hide the link instead of offering a dead end.
const navItems: { label: string; href: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, roles: STAFF },
  { label: 'Projets de création', href: '/projets-creation', icon: Scissors, roles: STAFF },
  { label: 'Gestion de contenu', href: '/gestion-contenu', icon: FileEdit, roles: CONTENT },
  { label: 'Médiathèque', href: '/mediatheque', icon: ImageIcon, roles: CONTENT },
  { label: 'Paramètres IA', href: '/ai-settings', icon: Sparkles, roles: [Role.ADMIN] },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const visibleItems = navItems.filter((item) => role !== undefined && item.roles.includes(role));

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block border-r border-border min-h-[calc(100vh-4rem)] p-6 bg-white">
      <p className="px-4 mb-4 text-xs uppercase tracking-wider text-angaly-slate font-semibold">
        Administration
      </p>
      <nav className="space-y-1">
        <Link
          href={ROUTES.home}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-angaly-slate border border-border hover:bg-angaly-ivory hover:text-angaly-navy transition-colors"
        >
          <Home size={18} />
          Retour au site
        </Link>
        <Link
          href={ROUTES.compte}
          className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl text-sm font-medium text-angaly-slate border border-border hover:bg-angaly-ivory hover:text-angaly-navy transition-colors"
        >
          <UserRound size={18} />
          Espace client
        </Link>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-angaly-navy text-white'
                  : 'text-angaly-slate hover:bg-angaly-warm-ivory hover:text-angaly-navy'
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
