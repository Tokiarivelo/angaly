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
  const userName = session?.user?.name || 'Personnel ANGALY';
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'A';
  const visibleItems = navItems.filter((item) => role !== undefined && item.roles.includes(role));

  const roleLabel =
    role === Role.ADMIN
      ? 'Administrateur'
      : role === Role.MANAGER
        ? 'Manager Atelier'
        : role === Role.COUTURIERE
          ? 'Couturière Atelier'
          : 'Staff';

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col bg-[#061938] border-r border-[#18375D] min-h-screen py-8 select-none z-40">
      {/* Brand Header */}
      <div className="px-6 mb-8">
        <Link href={ROUTES.home} className="block group">
          <h1 className="font-heading text-2xl tracking-[0.2em] text-[#F6F2E9] uppercase group-hover:text-angaly-champagne transition-colors">
            ANGALY
          </h1>
          <p className="font-sans text-xs tracking-widest text-angaly-champagne uppercase mt-1 opacity-80">
            Atelier Back-Office
          </p>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-0 [scrollbar-width:thin] [scrollbar-color:#18375D_#061938]">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
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

      {/* Footer Profile & Switch */}
      <div className="mt-auto px-6 pt-6 border-t border-[#18375D]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full border border-angaly-champagne bg-[#0C2650] flex items-center justify-center text-angaly-champagne font-heading text-sm font-semibold shrink-0">
            {userInitial}
          </div>
          <div className="overflow-hidden">
            <p className="text-[#F6F2E9] font-heading text-sm tracking-wide truncate">
              {userName}
            </p>
            <p className="text-angaly-champagne font-sans text-xs truncate">
              {roleLabel}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-[#18375D]/40">
          <Link
            href={ROUTES.compte}
            className="text-[#D8D3C8]/75 hover:text-[#C5B190] flex items-center gap-3 transition-colors font-sans text-xs tracking-wide uppercase w-full"
          >
            <UserRound size={15} />
            <span>Espace client</span>
          </Link>
          <Link
            href={ROUTES.home}
            className="text-[#D8D3C8]/75 hover:text-[#C5B190] flex items-center gap-3 transition-colors font-sans text-xs tracking-wide uppercase w-full"
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
