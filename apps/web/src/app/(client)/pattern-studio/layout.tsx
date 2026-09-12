import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth } from '@/lib/auth/auth';
import { REDIRECT_TO_PARAM } from '@/features/authentification/consts/queryKeys';

// Angaly Pattern Studio — distinct dark/champagne identity (palette doc §13).
// Layout protects /wizard/* and /projects/* subpaths while leaving /pattern-studio landing public.
export default async function PatternStudioLayout({ children }: { children: ReactNode }) {
  const currentPath = (await headers()).get('x-pathname') ?? '/pattern-studio';
  const pathname = currentPath.split('?')[0] ?? '';

  if (pathname.startsWith('/pattern-studio/wizard') || pathname.startsWith('/pattern-studio/projects')) {
    const session = await auth();
    if (!session?.user || session.error === 'RefreshAccessTokenError') {
      redirect(`/connexion?${REDIRECT_TO_PARAM}=${encodeURIComponent(currentPath)}`);
    }
  }

  return (
    <div className="bg-[#041329] text-white min-h-screen flex flex-col font-sans selection:bg-[#C5B190] selection:text-[#041329]">
      {children}
    </div>
  );
}
