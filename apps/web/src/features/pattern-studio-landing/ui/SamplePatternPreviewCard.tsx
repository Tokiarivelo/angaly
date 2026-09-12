import React from 'react';
import { Layers, Move, Scissors } from 'lucide-react';

interface SamplePatternPreviewCardProps {
  content: {
    title: string;
    subtitle: string;
  };
}

export const SamplePatternPreviewCard: React.FC<SamplePatternPreviewCardProps> = ({ content }) => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#061938]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-light mb-3">
            {content.title}
          </h2>
          <p className="text-[#D8D3C8] text-sm font-light">
            {content.subtitle}
          </p>
        </div>

        {/* Technical Drawing Canvas Card */}
        <div className="bg-[#0C2650] border border-[#C5B190]/30 rounded-2xl p-6 lg:p-10 shadow-2xl relative overflow-hidden">
          {/* Header Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C5B190]/20 pb-6 mb-8 text-xs text-[#D8D3C8]">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-white font-medium">
                <Layers className="w-4 h-4 text-[#C5B190]" /> Modèle : Jupe Trapèze Épurée
              </span>
              <span className="hidden sm:inline text-[#C5B190]/60">•</span>
              <span className="hidden sm:inline">Échelle : 1:1</span>
              <span className="hidden sm:inline text-[#C5B190]/60">•</span>
              <span className="hidden sm:inline">Marge couture : 1.5 cm</span>
            </div>
            <div className="flex items-center gap-4 text-[#C5B190]">
              <span className="flex items-center gap-1">
                <Move className="w-3.5 h-3.5" /> Droit-fil indiqué
              </span>
              <span className="flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5" /> Repères de découpe
              </span>
            </div>
          </div>

          {/* SVG technical preview of pieces */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4 items-center">
            {/* Pièce 1: Devant */}
            <div className="border border-[#C5B190]/20 rounded-xl p-5 bg-[#041329]/60 flex flex-col items-center relative">
              <span className="text-xs uppercase tracking-wider text-[#C5B190] font-medium mb-4 self-start">
                01. Devant (Au pli)
              </span>
              <svg
                viewBox="0 0 200 280"
                className="w-full h-56 stroke-[#C5B190] fill-[#0C2650]/40 stroke-[1.5]"
              >
                {/* Outer skirt front piece */}
                <path d="M 60 40 L 140 40 L 170 240 L 30 240 Z" />
                {/* Seam allowance dotted line */}
                <path
                  d="M 65 46 L 135 46 L 163 234 L 37 234 Z"
                  className="stroke-white/40 stroke-1 stroke-dasharray-[4,4] fill-none"
                />
                {/* Grainline arrow */}
                <line x1="100" y1="80" x2="100" y2="200" className="stroke-[#C5B190] stroke-1" />
                <polygon points="97,85 100,75 103,85" className="fill-[#C5B190]" />
                <polygon points="97,195 100,205 103,195" className="fill-[#C5B190]" />
                {/* Technical notch */}
                <line x1="60" y1="120" x2="52" y2="120" className="stroke-[#936C3E] stroke-2" />
              </svg>
              <div className="w-full flex justify-between text-[11px] text-[#D8D3C8] mt-3">
                <span>Largeur : 48.5 cm</span>
                <span>Longueur : 62.0 cm</span>
              </div>
            </div>

            {/* Pièce 2: Dos (en 2 parties) */}
            <div className="border border-[#C5B190]/20 rounded-xl p-5 bg-[#041329]/60 flex flex-col items-center relative">
              <span className="text-xs uppercase tracking-wider text-[#C5B190] font-medium mb-4 self-start">
                02. Demi-Dos (×2)
              </span>
              <svg
                viewBox="0 0 200 280"
                className="w-full h-56 stroke-[#C5B190] fill-[#0C2650]/40 stroke-[1.5]"
              >
                {/* Outer skirt back piece with zip allowance */}
                <path d="M 50 40 L 130 40 L 155 240 L 50 240 Z" />
                {/* Seam allowance dotted */}
                <path
                  d="M 56 46 L 124 46 L 148 234 L 56 234 Z"
                  className="stroke-white/40 stroke-1 stroke-dasharray-[4,4] fill-none"
                />
                {/* Grainline arrow */}
                <line x1="90" y1="80" x2="90" y2="200" className="stroke-[#C5B190] stroke-1" />
                <polygon points="87,85 90,75 93,85" className="fill-[#C5B190]" />
                <polygon points="87,195 90,205 93,195" className="fill-[#C5B190]" />
                {/* Notches for zipper */}
                <line x1="50" y1="90" x2="42" y2="90" className="stroke-[#936C3E] stroke-2" />
                <line x1="50" y1="170" x2="42" y2="170" className="stroke-[#936C3E] stroke-2" />
              </svg>
              <div className="w-full flex justify-between text-[11px] text-[#D8D3C8] mt-3">
                <span>Largeur : 26.0 cm</span>
                <span>Zip invisible : 22 cm</span>
              </div>
            </div>

            {/* Pièce 3: Ceinture */}
            <div className="border border-[#C5B190]/20 rounded-xl p-5 bg-[#041329]/60 flex flex-col items-center relative">
              <span className="text-xs uppercase tracking-wider text-[#C5B190] font-medium mb-4 self-start">
                03. Ceinture thermocollée
              </span>
              <svg
                viewBox="0 0 200 280"
                className="w-full h-56 stroke-[#C5B190] fill-[#0C2650]/40 stroke-[1.5]"
              >
                {/* Waistband rectangle */}
                <rect x="25" y="90" width="150" height="70" rx="2" />
                {/* Seam allowance dotted */}
                <rect
                  x="30"
                  y="96"
                  width="140"
                  height="58"
                  className="stroke-white/40 stroke-1 stroke-dasharray-[4,4] fill-none"
                />
                {/* Center fold line */}
                <line
                  x1="25"
                  y1="125"
                  x2="175"
                  y2="125"
                  className="stroke-[#C5B190]/50 stroke-1 stroke-dasharray-[2,2]"
                />
                {/* Grainline horizontal */}
                <line x1="55" y1="110" x2="145" y2="110" className="stroke-[#C5B190] stroke-1" />
                <polygon points="60,107 50,110 60,113" className="fill-[#C5B190]" />
                <polygon points="140,107 150,110 140,113" className="fill-[#C5B190]" />
              </svg>
              <div className="w-full flex justify-between text-[11px] text-[#D8D3C8] mt-3">
                <span>Tour taille : 72 cm</span>
                <span>Hauteur finie : 3.5 cm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
