import React from 'react';
import type { CustomizationOptions } from '../schemas/customization-options.schema';

interface SelectionSummaryBarProps {
  options: CustomizationOptions;
  isValid: boolean;
  isSavingDraft: boolean;
  isSubmitting: boolean;
  onSaveDraft: () => void | Promise<void>;
  onSubmit: () => void | Promise<void>;
}

export const SelectionSummaryBar: React.FC<SelectionSummaryBarProps> = ({
  options,
  isValid,
  isSavingDraft,
  isSubmitting,
  onSaveDraft,
  onSubmit,
}) => {
  const selectedKeys = Object.entries(options)
    .filter(([key, val]) => val && key !== 'notes' && key !== 'detailsDecoratifs')
    .map(([_, val]) => val as string);

  return (
    <div className="sticky bottom-0 w-full bg-ivory border-t border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 gap-4">
      <div className="flex-1 overflow-x-auto">
        {selectedKeys.length > 0 ? (
          <div className="flex gap-2 whitespace-nowrap pb-2 md:pb-0">
            {selectedKeys.map((tag) => (
              <span key={tag} className="text-xs bg-white border border-border px-2 py-1 rounded-md text-primary-deep-navy font-medium">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate italic">Aucune option sélectionnée.</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="button"
          onClick={() => { void onSaveDraft(); }}
          disabled={isSavingDraft || isSubmitting}
          className="px-6 py-2 border border-primary-deep-navy text-primary-deep-navy font-medium rounded-full hover:bg-primary-deep-navy hover:text-white transition-colors disabled:opacity-50"
        >
          {isSavingDraft ? 'Enregistrement...' : 'Enregistrer comme brouillon'}
        </button>
        <button
          type="button"
          onClick={() => { void onSubmit(); }}
          disabled={!isValid || isSavingDraft || isSubmitting}
          className="px-6 py-2 bg-primary-deep-navy text-white font-medium rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Validation...' : 'Continuer vers la prise de rendez-vous'}
        </button>
      </div>
    </div>
  );
};
