'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
      <aside className="w-full lg:w-80 shrink-0 border-l border-border p-5 space-y-4">
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
    <aside className="w-full lg:w-80 shrink-0 border-l border-border p-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-angaly-navy">Détail du média</h2>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Fermer"
          className="p-1 text-angaly-slate hover:text-angaly-navy"
        >
          <X size={18} />
        </button>
      </div>

      {media.width && media.height ? (
        <Image
          src={media.url}
          alt={media.altText ?? ''}
          width={media.width}
          height={media.height}
          sizes="320px"
          className="w-full h-auto rounded-lg border border-border mb-4"
        />
      ) : (
        <div className="relative w-full aspect-video rounded-lg border border-border mb-4 overflow-hidden bg-angaly-warm-ivory">
          <Image src={media.url} alt={media.altText ?? ''} fill sizes="320px" className="object-cover" />
        </div>
      )}

      <dl className="text-xs text-angaly-slate space-y-1 mb-4">
        <div className="flex justify-between">
          <dt>Fichier</dt>
          <dd className="truncate max-w-[180px]">{fileNameFromUrl(media.url)}</dd>
        </div>
        {media.width && media.height && (
          <div className="flex justify-between">
            <dt>Dimensions</dt>
            <dd>
              {media.width} × {media.height}px
            </dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Taille</dt>
          <dd>{formatFileSize(media.sizeBytes)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Importé le</dt>
          <dd>{new Date(media.createdAt).toLocaleDateString('fr-FR')}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Dossier</dt>
          <dd>{media.entityType}</dd>
        </div>
      </dl>

      <form
        onSubmit={(e) => {
          void handleSubmit((values) => onSaveAltText(values.altText))(e);
        }}
        className="mb-5"
      >
        <label className="block text-xs font-medium text-angaly-slate mb-1" htmlFor="altText">
          Texte alternatif (alt)
        </label>
        <input
          id="altText"
          {...register('altText')}
          className="w-full p-2 border border-border rounded-lg text-sm focus:outline-none focus:border-angaly-navy"
        />
        {errors.altText && <p className="text-xs text-angaly-error mt-1">{errors.altText.message}</p>}
        <p className="text-[11px] text-angaly-slate mt-1">Important pour l&apos;accessibilité et le SEO.</p>
        <Button type="submit" size="sm" variant="secondary" disabled={isSavingAltText} className="mt-2">
          {isSavingAltText ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>

      <div className="mb-5">
        <p id="media-usage-heading" className="text-xs font-medium text-angaly-slate mb-2">
          Utilisée dans
        </p>
        {media.usedIn.length === 0 ? (
          <p className="text-xs text-angaly-slate italic">Aucune utilisation détectée.</p>
        ) : (
          <ul className="space-y-1">
            {media.usedIn.map((usage) => (
              <li key={`${usage.entityType}-${usage.entityId}`} className="text-xs text-angaly-navy">
                {usage.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
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
        <Button
          type="button"
          className="w-full"
          disabled={isReplacing}
          onClick={() => replaceInputRef.current?.click()}
        >
          {isReplacing ? 'Remplacement…' : "Remplacer l'image"}
        </Button>
        <a
          href={media.url}
          download
          className="block text-center text-sm border border-border rounded-lg py-2 text-angaly-navy hover:bg-angaly-warm-ivory"
        >
          Télécharger
        </a>
        <button
          type="button"
          disabled={isReferenced || isDeleting}
          onClick={() => setConfirmDeleteOpen(true)}
          aria-describedby={isReferenced ? 'media-usage-heading' : undefined}
          className="w-full text-center text-xs text-angaly-error underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed py-1"
        >
          Supprimer
        </button>
        {isReferenced && (
          <p className="text-[11px] text-angaly-slate text-center">
            Encore utilisé — voir « Utilisée dans » ci-dessus.
          </p>
        )}
        {deleteErrorMessage && <p className="text-xs text-angaly-error">{deleteErrorMessage}</p>}
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
