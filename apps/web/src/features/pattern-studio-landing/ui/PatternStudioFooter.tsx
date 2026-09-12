import React from 'react';
import Link from 'next/link';

export const PatternStudioFooter = () => {
  return (
    <footer className="w-full bg-[#041329] border-t border-[#C5B190]/15 py-12 px-4 sm:px-6 lg:px-8 text-xs text-[#D8D3C8]/70">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg tracking-widest text-white">ANGALY</span>
          <span className="text-[#C5B190]/40">•</span>
          <span>Atelier de haute couture numérique</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link href="/" className="hover:text-[#C5B190] transition-colors">
            Maison ANGALY
          </Link>
          <Link href="/nos-ateliers" className="hover:text-[#C5B190] transition-colors">
            Nos Ateliers
          </Link>
          <Link href="/contact" className="hover:text-[#C5B190] transition-colors">
            Contact
          </Link>
          <Link href="/a-propos" className="hover:text-[#C5B190] transition-colors">
            Mentions Légales
          </Link>
        </div>

        <p className="text-[11px] text-[#D8D3C8]/50">
          © {new Date().getFullYear()} ANGALY Couture. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
};
