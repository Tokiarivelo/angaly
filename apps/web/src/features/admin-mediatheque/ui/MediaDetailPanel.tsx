'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatFileSize } from '@/lib/utils';
import { mediaAltTextSchema } from '../schemas/media-alt-text.schema';
import type { MediaAltTextFormValues } from '../schemas/media-alt-text.schema';
import type { MediaDetailDto } from '../types/media-item.types';

function fileNameFromUrl(url: string): string {
  return url.split('/').pop() ?? url;
}

interface MediaDetailPanelProps {
  media: MediaDetailDto | null;
  isLoading: boolean;
  onClose: () => void;
  onSaveAltText: (altText: string) => void;
  isSavingAltText: boolean;
  onReplace: (file: File) => void;
  isReplacing: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  deleteErrorMessage: string | null;
}

export const MediaDetailPanel: React.FC<MediaDetailPanelProps> = ({
  media,
  isLoading,
  onClose,
  onSaveAltText,
  isSavingAltText,
  onReplace,
  isReplacing,
  onDelete,
  isDeleting,
  deleteErrorMessage,
}) => {
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MediaAltTextFormValues>({
    resolver: zodResolver(mediaAltTextSchema),
    defaultValues: { altText: '' },
  });

  useEffect(() => {
    if (media) {
      reset({ altText: media.altText ?? '' });
    }
  }, [media, reset]);

  // Focus the panel on open, restore focus to whatever triggered it on close —
  // this panel is a persistent side panel (not a modal), so it doesn't use
  // Radix Dialog's built-in focus trap, but still needs basic focus hygiene.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      previouslyFocusedRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (isLoading) {
    return (
      <aside className="w-full lg:w-96 shrink-0 border border-angaly-border rounded-sm bg-white p-6 shadow-sm space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </aside>
    );
  }

  if (!media) return null;

  const isReferenced = media.usedIn.length > 0;

  return (
    <aside className="w-full lg:w-96 shrink-0 border border-angaly-border rounded-sm bg-white p-6 shadow-sm overflow-y-auto space-y-6">
      <div className="flex items-center justify-between border-b border-angaly-border pb-4">
        <div>
          <h2 className="font-heading text-xl text-angaly-navy">Détail du média</h2>
          <p className="text-[11px] text-angaly-slate">Propriétés et utilisations</p>
        </div>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Fermer"
          className="p-1.5 text-angaly-slate hover:text-angaly-navy hover:bg-angaly-ivory rounded-sm transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="aspect-[4/3] rounded-sm border border-angaly-border bg-angaly-ivory/60 overflow-hidden relative shadow-inner">
        <Image
          src={media.url}
          alt={media.altText ?? ''}
          fill
          sizes="384px"
          className="object-cover"
        />
      </div>

      <dl className="text-xs space-y-2 border-b border-angaly-border pb-4">
        <div className="flex justify-between items-center">
          <dt className="text-[11px] uppercase tracking-wider text-angaly-slate font-semibold">Fichier</dt>
          <dd className="font-medium text-angaly-navy truncate max-w-[200px]" title={fileNameFromUrl(media.url)}>
            {fileNameFromUrl(media.url)}
          </dd>
        </div>
        {media.width && media.height && (
          <div className="flex justify-between items-center">
            <dt className="text-[11px] uppercase tracking-wider text-angaly-slate font-semibold">Dimensions</dt>
            <dd className="font-medium text-angaly-navy font-mono">
              {media.width} × {media.height} px
            </dd>
          </div>
        )}
        <div className="flex justify-between items-center">
          <dt className="text-[11px] uppercase tracking-wider text-angaly-slate font-semibold">Poids</dt>
          <dd className="font-medium text-angaly-navy font-mono">{formatFileSize(media.sizeBytes)}</dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-[11px] uppercase tracking-wider text-angaly-slate font-semibold">Importé le</dt>
          <dd className="font-medium text-angaly-navy">{new Date(media.createdAt).toLocaleDateString('fr-FR')}</dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-[11px] uppercase tracking-wider text-angaly-slate font-semibold">Dossier</dt>
          <dd className="font-medium text-angaly-navy">{media.entityType}</dd>
        </div>
      </dl>

      <form
        onSubmit={(e) => {
          void handleSubmit((values) => onSaveAltText(values.altText))(e);
        }}
        className="space-y-2"
      >
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate" htmlFor="altText">
          Texte alternatif (alt)
        </label>
        <input
          id="altText"
          {...register('altText')}
          className="w-full px-3 py-2 border border-angaly-border rounded-sm text-xs text-angaly-navy bg-white focus:outline-none focus:border-angaly-gold focus:ring-1 focus:ring-angaly-gold transition-colors"
        />
        {errors.altText && <p className="text-xs text-angaly-error font-medium">{errors.altText.message}</p>}
        <p className="text-[11px] text-angaly-slate">Important pour l&apos;accessibilité et le SEO.</p>
        <button
          type="submit"
          disabled={isSavingAltText}
          className="px-4 py-2 border border-angaly-navy text-angaly-navy hover:bg-angaly-ivory rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSavingAltText ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      <div className="border-t border-angaly-border pt-4">
        <p id="media-usage-heading" className="text-[11px] font-semibold uppercase tracking-wider text-angaly-navy mb-2">
          Utilisée dans
        </p>
        {media.usedIn.length === 0 ? (
          <p className="text-xs text-angaly-slate italic">Aucune utilisation détectée.</p>
        ) : (
          <ul className="space-y-1.5">
            {media.usedIn.map((usage) => (
              <li key={`${usage.entityType}-${usage.entityId}`} className="text-xs text-angaly-navy flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-angaly-gold shrink-0" />
                <span>{usage.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 border-t border-angaly-border pt-4">
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onReplace(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          disabled={isReplacing}
          onClick={() => replaceInputRef.current?.click()}
          className="w-full py-2.5 px-4 bg-angaly-navy hover:bg-angaly-navy-blue text-white rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {isReplacing ? 'Remplacement…' : "Remplacer l'image"}
        </button>
        <a
          href={media.url}
          download
          className="block text-center text-xs font-semibold uppercase tracking-wider border border-angaly-border bg-white rounded-sm py-2 text-angaly-navy hover:bg-angaly-ivory transition-colors"
        >
          Télécharger
        </a>
        <button
          type="button"
          disabled={isReferenced || isDeleting}
          onClick={() => setConfirmDeleteOpen(true)}
          aria-describedby={isReferenced ? 'media-usage-heading' : undefined}
          className="w-full text-center text-xs text-angaly-error hover:bg-red-50 py-1.5 rounded-sm transition-colors font-medium disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
        >
          Supprimer
        </button>
        {isReferenced && (
          <p className="text-[11px] text-angaly-slate text-center font-medium">
            Encore utilisé — voir « Utilisée dans » ci-dessus.
          </p>
        )}
        {deleteErrorMessage && <p className="text-xs text-angaly-error font-medium">{deleteErrorMessage}</p>}
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Supprimer ce média ?"
        description="Cette action est définitive et ne peut pas être annulée."
        confirmLabel="Supprimer"
        variant="destructive"
        isConfirming={isDeleting}
        onConfirm={() => {
          onDelete();
          setConfirmDeleteOpen(false);
        }}
      />
    </aside>
  );
};
