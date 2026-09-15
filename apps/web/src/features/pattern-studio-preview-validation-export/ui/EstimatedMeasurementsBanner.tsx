import React from 'react';
import { Sparkles } from 'lucide-react';

interface EstimatedMeasurementsBannerProps {
  estimatedKeys: string[];
}

export const EstimatedMeasurementsBanner: React.FC<EstimatedMeasurementsBannerProps> = ({
  estimatedKeys,
}) => {
  if (estimatedKeys.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[#C5B190]/10 border border-[#C5B190]/40 rounded-xl p-4 mb-6 flex items-start gap-3">
      <span className="p-2 rounded-lg bg-[#C5B190]/20 text-[#C5B190] mt-0.5 shrink-0">
        <Sparkles className="w-4 h-4" />
      </span>
      <div className="text-xs text-[#D8D3C8] leading-relaxed">
        <p className="text-white font-medium text-sm mb-1">
          Certaines mesures ont été estimées par l'IA — à vérifier
        </p>
        <p>
          {estimatedKeys.join(', ')} — ces valeurs sont indicatives et n'ont pas été mesurées
          directement. Nous vous recommandons de les confirmer avec votre couturière avant
          validation finale.
        </p>
      </div>
    </div>
  );
};
