import { Button } from '@/components/ui/button';

interface WizardFooterNavProps {
  showBack: boolean;
  onBack: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  disabled: boolean;
}

/**
 * Retour/Continuer (or Envoyer) — reused at the bottom of each step.
 *
 * Always `type="button"`, never `type="submit"`: this button's label/action
 * flips between "Continuer" (goNext) and "Envoyer ma demande" (submit) based
 * on the very state its own click changes. A native `type="submit"` button
 * whose `type` attribute mutates to "submit" as a *result* of clicking it
 * (step 2 → 3) can have that click re-interpreted as a form submission by
 * the browser mid-interaction — reproduced live (step 3 loaded with the
 * submit already fired and 401'd, before "Envoyer ma demande" was ever
 * clicked). Explicit `onClick` + `onPrimary` avoids the native-submit
 * mechanism entirely; `DemandeSurMesureWizard`'s `<form onSubmit>` mirrors
 * the same step-aware dispatch for the Enter key.
 */
export function WizardFooterNav({ showBack, onBack, primaryLabel, onPrimary, disabled }: WizardFooterNavProps) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      {showBack ? (
        <button type="button" onClick={onBack} className="text-sm text-angaly-slate underline-offset-4 hover:underline">
          Retour
        </button>
      ) : (
        <span />
      )}
      <Button type="button" onClick={onPrimary} disabled={disabled} size="lg">
        {primaryLabel}
      </Button>
    </div>
  );
}
