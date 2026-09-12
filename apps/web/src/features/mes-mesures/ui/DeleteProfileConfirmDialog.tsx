import React from 'react';
import { Button } from '@/components/ui/button';

interface DeleteProfileConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  profileName: string;
  isDeleting: boolean;
}

export const DeleteProfileConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  profileName,
  isDeleting,
}: DeleteProfileConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-angaly-primary/20 backdrop-blur-sm">
      <div className="w-full max-w-sm p-6 bg-angaly-ivory rounded-lg shadow-xl border border-border">
        <h3 className="mb-4 font-serif text-xl text-angaly-primary">Supprimer le profil ?</h3>
        <p className="mb-6 text-sm text-angaly-slate">
          Êtes-vous sûr de vouloir supprimer le profil "<strong>{profileName}</strong>" ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="default" onClick={onConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </div>
  );
};
