import React from 'react';
import { Sparkles } from 'lucide-react';

export const GenerationLoadingScreen = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      {/* Animated couture silhouette line drawing */}
      <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[#C5B190]/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-[#C5B190]/40 animate-spin [animation-duration:8s]" />
        
        {/* Stylized SVG silhouette */}
        <svg
          viewBox="0 0 100 100"
          className="w-20 h-20 stroke-[#C5B190] fill-none stroke-[1.5] transition-all"
        >
          <path
            d="M 35 20 Q 50 25 65 20 L 75 45 Q 60 55 50 60 Q 40 55 25 45 Z"
            className="animate-pulse"
          />
          <path
            d="M 35 60 Q 50 62 65 60 L 80 90 L 20 90 Z"
            className="animate-pulse [animation-delay:400ms]"
          />
          <circle cx="50" cy="50" r="1.5" className="fill-[#C5B190]" />
        </svg>

        <span className="absolute -bottom-2 -right-2 p-2 rounded-full bg-[#0C2650] border border-[#C5B190] text-[#C5B190]">
          <Sparkles className="w-4 h-4 animate-bounce" />
        </span>
      </div>

      <h2 className="font-serif text-2xl sm:text-3xl font-light text-white mb-3">
        Génération de votre patron en cours…
      </h2>
      <p className="text-[#D8D3C8] text-sm font-light max-w-md mx-auto leading-relaxed">
        Notre moteur de patronage calcule vos pièces avec une précision millimétrique,
        conformément à vos mensurations et vos choix de coupe.
      </p>
    </div>
  );
};
