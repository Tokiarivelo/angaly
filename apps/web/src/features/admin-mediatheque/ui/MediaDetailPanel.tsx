'use client';

import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { mediaAltTextSchema } from '../schemas/media-alt-text.schema';
import type { MediaAltTextFormValues } from '../schemas/media-alt-text.schema';
import type { MediaDetailDto } from '../types/media-item.types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

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

  if (isLoading) {
    return (
      <aside className="w-full lg:w-80 shrink-0 border-l border-border p-5">
        <p className="text-sm text-slate">Chargement…</p>
      </aside>
    );
  }

  if (!media) return null;

  const isReferenced = media.usedIn.length > 0;

  return (
    <aside className="w-full lg:w-80 shrink-0 border-l border-border p-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-primary-deep-navy">Détail du média</h2>
        <button onClick={onClose} aria-label="Fermer" className="p-1 text-slate hover:text-primary-deep-navy">
          <X size={18} />
        </button>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.url} alt={media.altText ?? ''} className="w-full rounded-lg border border-border mb-4" />

      <dl className="text-xs text-slate space-y-1 mb-4">
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
          <dd>{formatSize(media.sizeBytes)}</dd>
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
        <label className="block text-xs font-medium text-slate mb-1" htmlFor="altText">
          Texte alternatif (alt)
        </label>
        <input
          id="altText"
          {...register('altText')}
          className="w-full p-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary-deep-navy"
        />
        {errors.altText && <p className="text-xs text-red-600 mt-1">{errors.altText.message}</p>}
        <p className="text-[11px] text-slate mt-1">Important pour l&apos;accessibilité et le SEO.</p>
        <Button type="submit" size="sm" variant="secondary" disabled={isSavingAltText} className="mt-2">
          {isSavingAltText ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>

      <div className="mb-5">
        <p className="text-xs font-medium text-slate mb-2">Utilisée dans</p>
        {media.usedIn.length === 0 ? (
          <p className="text-xs text-slate italic">Aucune utilisation détectée.</p>
        ) : (
          <ul className="space-y-1">
            {media.usedIn.map((usage) => (
              <li key={`${usage.entityType}-${usage.entityId}`} className="text-xs text-primary-deep-navy">
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
          className="block text-center text-sm border border-border rounded-lg py-2 text-primary-deep-navy hover:bg-ivory-warm"
        >
          Télécharger
        </a>
        <button
          type="button"
          disabled={isReferenced || isDeleting}
          onClick={onDelete}
          title={isReferenced ? 'Ce média est encore utilisé — impossible de le supprimer' : undefined}
          className="w-full text-center text-xs text-red-600 underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed py-1"
        >
          Supprimer
        </button>
        {deleteErrorMessage && <p className="text-xs text-red-600">{deleteErrorMessage}</p>}
      </div>
    </aside>
  );
};
