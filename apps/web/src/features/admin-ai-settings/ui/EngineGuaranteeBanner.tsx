'use client';

import React from 'react';
import { Compass, Lock, Award } from 'lucide-react';

export const EngineGuaranteeBanner: React.FC = () => {
  return (
    <div className="bg-[#061938] text-[#F6F2E9] border border-[#18375D] rounded-sm p-6 relative overflow-hidden shadow-md">
      {/* Subtle Gold Geometric Corner Ornament */}
      <div className="absolute -right-6 -bottom-6 w-28 h-28 border border-[#C5B190]/20 rounded-full pointer-events-none" />

      <div className="flex items-center gap-2 mb-3 text-[#C5B190]">
        <Compass className="w-4 h-4 text-[#C5B190]" />
        <span className="text-[11px] uppercase font-semibold tracking-widest">
          Garantie Moteur ANGALY
        </span>
      </div>

      <h4 className="font-heading text-lg text-white font-normal leading-snug mb-2">
        L&apos;IA n&apos;élabore jamais vos lignes de coupe.
      </h4>

      <p className="text-xs text-[#D8D3C8] leading-relaxed font-light">
        Toutes les courbes de patronage, aisances d&apos;emmanchures, valeurs de couture et gradations millimétriques demeurent strictement exécutées sur les serveurs sécurisés d&apos;ANGALY. Aucun tracé vestimentaire n&apos;est téléversé chez les fournisseurs externes.
      </p>

      <div className="mt-5 pt-4 border-t border-[#18375D] flex items-center justify-between text-[11px] text-[#8A877F]">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#C5B190]" />
          <span>Chiffrement AES-256</span>
        </span>
        <span className="flex items-center gap-1.5 text-[#C5B190] uppercase tracking-wider text-[10px] font-medium">
          <Award className="w-3.5 h-3.5" />
          <span>Patronage Déterministe</span>
        </span>
      </div>
    </div>
  );
};
