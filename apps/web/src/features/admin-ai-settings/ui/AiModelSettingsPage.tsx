'use client';

import React from 'react';
import { Check, Sparkles, Database } from 'lucide-react';
import { useAiModelSetting } from '../hooks/useAiModelSetting';
import { useAvailableAiModels } from '../hooks/useAvailableAiModels';
import { useUpdateAiModelSetting } from '../hooks/useUpdateAiModelSetting';
import type { MeasurementModelPreference } from '@angaly/types';

const MODEL_OPTIONS: Array<{
  id: MeasurementModelPreference;
  label: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  {
    id: 'GEMINI',
    label: 'IA générative (Gemini)',
    description:
      "Estime les mesures manquantes via l'API Gemini, guidée par la table de tailles standard. Toujours disponible.",
    icon: Sparkles,
  },
  {
    id: 'LOCAL_STATISTICAL',
    label: 'Modèle statistique entraîné',
    description:
      "Modèle entraîné sur des données anthropométriques réelles (ANSUR II, ~6000 sujets). Auto-hébergé, sans appel réseau externe.",
    icon: Database,
  },
];

export const AiModelSettingsPage: React.FC = () => {
  const { data: setting, isLoading } = useAiModelSetting();
  const { data: availableModels } = useAvailableAiModels();
  const { mutate: updateModel, isPending } = useUpdateAiModelSetting();

  const availableIds = availableModels?.measurementEstimation ?? ['GEMINI'];

  return (
    <div>
      <h1 className="font-serif text-2xl sm:text-3xl text-primary-deep-navy font-light mb-2">
        Paramètres IA — Pattern Studio
      </h1>
      <p className="text-slate text-sm mb-8">
        Choisissez le modèle utilisé pour estimer les mesures manquantes lors de la génération
        d'un patron. Ce choix n'affecte jamais la génération elle-même : une estimation reste
        toujours indicative et soumise à confirmation (apps/api/docs/features/ai-model-settings.md).
      </p>

      {isLoading ? (
        <p className="text-sm text-slate">Chargement…</p>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {MODEL_OPTIONS.map((option) => {
            const isSelected = setting?.measurementModel === option.id;
            const isAvailable = availableIds.includes(option.id);
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                disabled={!isAvailable || isPending}
                onClick={() => updateModel(option.id)}
                className={`w-full text-left p-5 rounded-xl border transition-all flex items-start gap-4 ${
                  isSelected
                    ? 'bg-white border-primary-deep-navy ring-1 ring-primary-deep-navy'
                    : 'bg-white border-border hover:border-primary-deep-navy/50'
                } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon size={20} />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-primary-deep-navy font-medium text-sm">{option.label}</h2>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-primary-deep-navy text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-slate text-xs leading-relaxed mt-1">{option.description}</p>
                  {!isAvailable && (
                    <p className="text-red-600 text-xs mt-2">
                      Indisponible — le modèle n'est pas chargé côté apps/ai-service.
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          {setting?.updatedAt && (
            <p className="text-xs text-slate">
              Dernière modification : {new Date(setting.updatedAt).toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
