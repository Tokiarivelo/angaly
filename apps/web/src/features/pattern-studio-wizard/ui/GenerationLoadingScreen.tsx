import React from 'react';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { GENERATION_STAGES, useGenerationProgress } from '../hooks/useGenerationProgress';

interface GenerationLoadingScreenProps {
  title?: string;
  description?: string;
  /** Show the per-stage checklist (generation) or only the spinner (page opening). */
  showStages?: boolean;
}

export const GenerationLoadingScreen: React.FC<GenerationLoadingScreenProps> = ({
  title = 'Génération de votre patron en cours…',
  description = 'Notre moteur de patronage calcule vos pièces avec une précision millimétrique, conformément à vos mensurations et vos choix de coupe.',
  showStages = true,
}) => {
  const { stageIndex, elapsedSeconds, isSlow } = useGenerationProgress(showStages);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"
    >
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

      <h2 className="font-serif text-2xl sm:text-3xl font-light text-white mb-3">{title}</h2>
      <p className="text-[#D8D3C8] text-sm font-light max-w-md mx-auto leading-relaxed">{description}</p>

      {showStages && (
        <>
          <ol className="mt-8 space-y-2 text-left text-sm" data-testid="generation-stages">
            {GENERATION_STAGES.map((stage, index) => {
              const done = index < stageIndex;
              const current = index === stageIndex;
              return (
                <li
                  key={stage}
                  aria-current={current ? 'step' : undefined}
                  className={`flex items-center gap-2.5 ${
                    done ? 'text-[#C5B190]' : current ? 'text-white' : 'text-[#D8D3C8]/40'
                  }`}
                >
                  {done ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : current ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-current opacity-60" />
                  )}
                  <span>{stage}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 text-[11px] text-[#D8D3C8]/60" data-testid="generation-elapsed">
            {isSlow
              ? `Toujours en cours (${elapsedSeconds} s) — si des mesures manquent, l’estimation par IA prend un peu plus de temps. Ne fermez pas cette page.`
              : `${elapsedSeconds} s — cela prend généralement quelques secondes.`}
          </p>
        </>
      )}
    </div>
  );
};
