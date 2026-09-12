import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Compass } from 'lucide-react';

export const PatternStudioHeader = () => {
  return (
    <header className="w-full bg-[#041329]/95 backdrop-blur-md border-b border-[#C5B190]/20 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl tracking-widest text-white group-hover:text-[#C5B190] transition-colors">
              ANGALY
            </span>
          </Link>
          <span className="h-4 w-px bg-[#C5B190]/30 hidden sm:inline-block" />
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-wider uppercase px-2 py-0.5 rounded bg-[#0C2650] text-[#C5B190] border border-[#C5B190]/30 font-medium">
              Pattern Studio
            </span>
          </div>
        </div>

        {/* Minimal Navigation */}
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="text-[#D8D3C8] hover:text-[#C5B190] flex items-center gap-1.5 transition-colors hidden sm:flex"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au site</span>
          </Link>
          <Link
            href="/mes-projets-patron"
            className="text-[#D8D3C8] hover:text-[#C5B190] flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-4 h-4 text-[#C5B190]" />
            <span>Mes projets</span>
          </Link>
          <Link
            href="/mes-mesures"
            className="text-[#D8D3C8] hover:text-[#C5B190] hidden md:inline-block transition-colors"
          >
            Mes mesures
          </Link>
          <Link
            href="/espace-client"
            className="p-2 rounded-full hover:bg-[#0C2650] text-[#C5B190] transition-colors"
            aria-label="Mon compte"
          >
            <User className="w-5 h-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
};
