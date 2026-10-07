import React from 'react';

interface StepItem {
  label: string;
  description?: string | null | undefined;
}

interface StepsProcessPreviewProps {
  title?: string | null | undefined;
  subtitle?: string | null | undefined;
  steps?: StepItem[] | undefined;
  cta?: string | null | undefined;
  isCompact?: boolean;
}

const DEFAULT_STEPS: StepItem[] = [
  { label: 'Rencontre', description: 'Consultation initiale' },
  { label: 'Esquisse', description: 'Croquis & Design' },
  { label: 'Matières', description: 'Choix des tissus' },
  { label: 'Prises', description: 'Mesures précises' },
  { label: 'Toile', description: 'Premier essayage' },
  { label: 'Ajustements', description: 'Retouches finales' },
  { label: 'Livraison', description: 'Votre création' },
];

export const StepsProcessPreview: React.FC<StepsProcessPreviewProps> = ({
  title = "L'Expérience Sur Mesure",
  subtitle = '7 étapes vers la perfection',
  steps,
  cta = 'Créer ma tenue sur mesure',
  isCompact = false,
}) => {
  const displaySteps = steps && steps.length > 0 ? steps : DEFAULT_STEPS;

  return (
    <section
      data-testid="steps-process-preview"
      className="bg-angaly-navy-blue p-6 sm:p-12 text-white border border-angaly-royal-navy rounded-sm text-center"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-2xl sm:text-4xl">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-xs sm:text-sm tracking-[0.2em] text-white/70 uppercase">
            {subtitle}
          </p>
        )}

        <ol className={`mt-10 flex flex-wrap items-start justify-center gap-x-2 gap-y-6 ${isCompact ? 'scale-90' : ''}`}>
          {displaySteps.map((step, index) => {
            const isEndpoint = index === 0 || index === displaySteps.length - 1;
            return (
              <li key={step.label + index} className="flex items-start">
                <div className="flex w-24 sm:w-28 flex-col items-center gap-2 text-center">
                  <span
                    className={`font-heading flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                      isEndpoint
                        ? 'border-angaly-champagne text-angaly-champagne'
                        : 'border-angaly-ivory/40 text-angaly-ivory'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="font-heading text-sm sm:text-base leading-tight">
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="text-[10px] sm:text-xs text-white/60 leading-tight">
                      {step.description}
                    </span>
                  )}
                </div>
                {index < displaySteps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="mt-4 h-px w-4 sm:w-8 flex-shrink-0 bg-white/30"
                  />
                )}
              </li>
            );
          })}
        </ol>

        {cta && (
          <div className="mt-10 flex justify-center">
            <span className="inline-flex items-center justify-center rounded-sm border border-white bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-angaly-navy shadow-sm transition-colors hover:bg-white/90">
              {cta}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
