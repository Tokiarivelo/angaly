import type { ReactNode } from 'react';

interface AuthSplitLayoutProps {
  brandBaseline: string;
  children: ReactNode;
}

/**
 * Shared split-screen layout for the 3 auth screens (55/45 desktop split —
 * see docs/pages/authentification.md). Verified against the real Stitch
 * markup (`get_screen`, not just stitch-prompts/29's memo): on mobile the
 * photo panel is fully hidden (`hidden md:flex`), not reduced to a banner —
 * the memo's "réduit à une bannière fine" doesn't match any of the 3 real
 * screens, which instead show a plain text branding block above the form.
 *
 * The left panel stands in for the editorial couture photograph the real
 * screens show, using a navy gradient instead of an actual image: no such
 * photo has been uploaded via MinIO yet (rule #21 forbids a
 * hardcoded/external image URL) — see "Points d'attention" in
 * docs/pages/authentification.md for the follow-up once one exists.
 */
export function AuthSplitLayout({ brandBaseline, children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="relative hidden overflow-hidden bg-gradient-to-t from-angaly-navy via-angaly-navy/70 to-transparent md:flex md:w-[55%] md:items-end md:p-12 lg:p-20">
        <div className="relative z-10">
          <p className="font-heading text-4xl tracking-[0.2em] text-white uppercase lg:text-6xl">Angaly</p>
          <p className="mt-4 max-w-md font-heading text-xl text-angaly-warm-ivory italic lg:text-2xl">{brandBaseline}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-angaly-ivory px-6 py-16 md:w-[45%] md:px-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-12 text-center md:hidden">
            <p className="font-heading text-3xl tracking-[0.2em] text-angaly-navy uppercase">Angaly</p>
            <p className="mt-2 font-heading text-lg text-angaly-slate italic">{brandBaseline}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
