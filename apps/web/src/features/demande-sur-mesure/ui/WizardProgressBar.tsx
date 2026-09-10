import type { WizardStep } from '../types/wizard-state.types';

const STEP_LABELS: Record<WizardStep, string> = { 1: 'Projet', 2: 'Coordonnées', 3: 'Détails' };
const STEPS: WizardStep[] = [1, 2, 3];

/**
 * Slim 3-segment progress bar, filled navy / unfilled warm-ivory, numbered
 * labels below — synthesized from the real Stitch screens, whose 3 progress
 * bars each show different, inconsistent step labels/styles ("01 Projet/02
 * Mesures/03 Coordonnées" on Étape 1, "Projet/Coordonnées/Confirmation" on
 * Étape 2, "Profil/Mesures/Détails" on Étape 3) — this page's own 3 real
 * steps (Projet/Coordonnées/Détails) are used consistently instead of
 * reproducing any one screen's drifted set verbatim.
 */
export function WizardProgressBar({ step }: { step: WizardStep }) {
  return (
    <div className="mb-10">
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <div key={s} className={`h-[2px] flex-1 ${s <= step ? 'bg-angaly-navy' : 'bg-angaly-warm-ivory'}`} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs tracking-wide text-angaly-slate uppercase">
        {STEPS.map((s) => (
          <span key={s} className={s === step ? 'font-medium text-angaly-navy' : undefined}>
            {String(s).padStart(2, '0')} {STEP_LABELS[s]}
          </span>
        ))}
      </div>
    </div>
  );
}
