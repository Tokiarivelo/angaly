'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PreviewToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  titleText?: string | null | undefined;
  subtitleText?: string | null | undefined;
}

export const PreviewToggle: React.FC<PreviewToggleProps> = ({ isOpen, onToggle, titleText, subtitleText }) => {
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-slate hover:text-primary-deep-navy"
      >
        {isOpen ? <EyeOff size={16} /> : <Eye size={16} />}
        Aperçu
      </button>
      {isOpen && (
        <div className="mt-3 p-6 bg-ivory border border-border rounded-xl text-center">
          <p className="font-serif text-xl text-primary-deep-navy">{titleText ?? 'Titre de la section'}</p>
          {subtitleText && <p className="text-sm text-slate mt-2">{subtitleText}</p>}
        </div>
      )}
    </div>
  );
};
