import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import type { DragEvent } from 'react';

import { FABRIC_SUGGESTIONS } from '../../consts/fabrics.const';
import type { UseDemandeSurMesureWizardResult } from '../../hooks/useDemandeSurMesureWizard';
import { ChipOption } from '../ChipOption';

type InspirationMessageStepProps = Pick<UseDemandeSurMesureWizardResult, 'values' | 'register' | 'selectFabric' | 'upload'>;

/** Step 3 — Inspiration & message: tissu souhaité, dropzone (jusqu'à 5 photos), message. */
export function InspirationMessageStep({ values, register, selectFabric, upload }: InspirationMessageStepProps) {
  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) void upload.addFiles(event.dataTransfer.files);
  }

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="fabricPreference" className="mb-2 block text-sm font-medium text-angaly-navy">
          Tissu souhaité
        </label>
        <input
          id="fabricPreference"
          type="text"
          {...register('fabricPreference')}
          placeholder="Ex: Soie sauvage, Coton tissé main..."
          className="border-angaly-border focus:border-angaly-navy w-full border-b bg-transparent py-2 text-angaly-navy focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {FABRIC_SUGGESTIONS.map((fabric) => (
            <ChipOption key={fabric} label={fabric} selected={values.fabricPreference === fabric} onSelect={() => selectFabric(fabric)} />
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-angaly-navy">Photos d&apos;inspiration</span>
        {upload.canAddMore && (
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-angaly-border flex cursor-pointer flex-col items-center gap-2 border border-dashed px-6 py-10 text-center transition-colors hover:border-angaly-navy"
          >
            <UploadCloud className="h-8 w-8 text-angaly-slate" strokeWidth={1} aria-hidden="true" />
            <span className="text-sm text-angaly-navy">Télécharger des fichiers ou glisser-déposer</span>
            <span className="text-xs text-angaly-slate">Formats acceptés : JPG, PNG — jusqu&apos;à {upload.maxPhotos} photos</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) void upload.addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        )}

        {upload.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {upload.photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square overflow-hidden border border-angaly-border">
                <Image src={photo.previewUrl} alt="" fill unoptimized sizes="120px" className="object-cover" />
                {photo.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-angaly-navy/40 text-xs text-white">
                    Envoi…
                  </div>
                )}
                {photo.status === 'error' && (
                  <div className="text-angaly-error absolute inset-0 flex items-center justify-center bg-white/90 text-xs">
                    Échec
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => upload.removePhoto(photo.id)}
                  aria-label={`Retirer ${photo.fileName}`}
                  className="bg-angaly-navy absolute top-1 right-1 rounded-full p-1 text-white"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-angaly-navy">
          Message ou instructions particulières
        </label>
        <textarea
          id="message"
          rows={4}
          {...register('message')}
          placeholder="Décrivez votre vision pour cette pièce unique..."
          className="border-angaly-border focus:border-angaly-navy w-full border bg-white p-3 text-sm text-angaly-navy focus:outline-none"
        />
      </div>
    </div>
  );
}
