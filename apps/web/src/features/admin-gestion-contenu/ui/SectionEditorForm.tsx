'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Locale } from '@angaly/types';

import { Button } from '@/components/ui/button';
import type { PageSectionDto } from '../api/page-sections.api';
import { sectionEditorSchema } from '../schemas/section-editor.schema';
import type { SectionEditorFormValues } from '../schemas/section-editor.schema';
import { LocaleTabs } from './LocaleTabs';
import { PreviewToggle } from './PreviewToggle';

interface SectionEditorFormProps {
  page: string;
  sectionKey: string;
  activeLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
  availableLocales: Locale[];
  section: PageSectionDto | null;
  isLoading: boolean;
  onSaveDraft: (values: SectionEditorFormValues) => void;
  isSaving: boolean;
  onPublish: () => void;
  isPublishing: boolean;
  onShowHistory: () => void;
  /** Lets the parent guard navigation (section/locale switch) while there are unsaved edits. */
  onDirtyChange?: (isDirty: boolean) => void;
}

const emptyValues = (locale: Locale): SectionEditorFormValues => ({
  locale,
  titleText: '',
  subtitleText: '',
  bodyText: '',
  ctaPrimaryLabel: '',
  ctaSecondaryLabel: '',
  mediaId: '',
});

export const SectionEditorForm: React.FC<SectionEditorFormProps> = ({
  page,
  sectionKey,
  activeLocale,
  onLocaleChange,
  availableLocales,
  section,
  isLoading,
  onSaveDraft,
  isSaving,
  onPublish,
  isPublishing,
  onShowHistory,
  onDirtyChange,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isDirty },
  } = useForm<SectionEditorFormValues>({
    resolver: zodResolver(sectionEditorSchema),
    defaultValues: emptyValues(activeLocale),
  });

  useEffect(() => {
    reset(
      section
        ? {
            locale: activeLocale,
            titleText: section.titleText ?? '',
            subtitleText: section.subtitleText ?? '',
            bodyText: section.bodyText ?? '',
            ctaPrimaryLabel: section.ctaPrimaryLabel ?? '',
            ctaSecondaryLabel: section.ctaSecondaryLabel ?? '',
            mediaId: section.mediaId ?? '',
          }
        : emptyValues(activeLocale),
    );
  }, [section, activeLocale, reset]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Only the 2 fields PreviewToggle renders subscribe here — watch() would
  // re-render every input on every keystroke just to feed this preview.
  const [previewTitle, previewSubtitle] = useWatch({ control, name: ['titleText', 'subtitleText'] });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-serif text-xl text-angaly-navy">
            {page} <span className="text-angaly-slate">&gt;</span> {sectionKey}
          </h2>
        </div>
        <button
          type="button"
          onClick={onShowHistory}
          className="text-xs text-angaly-slate hover:text-angaly-navy underline"
        >
          Voir l&apos;historique des versions
        </button>
      </div>

      <LocaleTabs activeLocale={activeLocale} onChange={onLocaleChange} availableLocales={availableLocales} />

      {isLoading ? (
        <div className="mt-6 space-y-5">
          <div className="h-9 w-full animate-pulse rounded-lg bg-angaly-warm-ivory" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-angaly-warm-ivory" />
          <div className="h-24 w-full animate-pulse rounded-lg bg-angaly-warm-ivory" />
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            void handleSubmit(onSaveDraft)(e);
          }}
          className="mt-6 space-y-5"
        >
          <div>
            <label className="block text-xs font-medium text-angaly-slate mb-1" htmlFor="titleText">
              Titre
            </label>
            <input
              id="titleText"
              {...register('titleText')}
              className="w-full p-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-angaly-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-angaly-slate mb-1" htmlFor="subtitleText">
              Sous-titre
            </label>
            <input
              id="subtitleText"
              {...register('subtitleText')}
              className="w-full p-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-angaly-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-angaly-slate mb-1" htmlFor="bodyText">
              Texte
            </label>
            <textarea
              id="bodyText"
              rows={4}
              {...register('bodyText')}
              className="w-full p-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-angaly-navy"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-angaly-slate mb-1" htmlFor="ctaPrimaryLabel">
                Texte du bouton principal
              </label>
              <input
                id="ctaPrimaryLabel"
                {...register('ctaPrimaryLabel')}
                className="w-full p-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-angaly-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-angaly-slate mb-1" htmlFor="ctaSecondaryLabel">
                Texte du bouton secondaire
              </label>
              <input
                id="ctaSecondaryLabel"
                {...register('ctaSecondaryLabel')}
                className="w-full p-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-angaly-navy"
              />
            </div>
          </div>

          <PreviewToggle
            isOpen={previewOpen}
            onToggle={() => setPreviewOpen((v) => !v)}
            titleText={previewTitle}
            subtitleText={previewSubtitle}
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button type="submit" variant="secondary" disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : 'Enregistrer comme brouillon'}
            </Button>
            <Button
              type="button"
              disabled={isPublishing || !section}
              onClick={onPublish}
              aria-describedby={!section ? 'publish-disabled-hint' : undefined}
            >
              {isPublishing ? 'Publication…' : 'Publier les modifications'}
            </Button>
            {!section && (
              <p id="publish-disabled-hint" className="text-xs text-angaly-slate self-center">
                Enregistrez un brouillon avant de publier.
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
