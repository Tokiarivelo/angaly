'use client';

import React, { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Locale } from '@angaly/types';

import { Button } from '@/components/ui/button';
import type { PageSectionDto } from '../api/page-sections.api';
import { findPageDefinition, findSectionDefinition, GENERIC_TEXT_FIELDS } from '../consts/section-catalog.const';
import type { TextFieldName } from '../consts/section-catalog.const';
import { asObject, mergeTranslatedData, pickText } from '../utils/merge-translation';
import { resolveDataJson, sectionEditorSchema } from '../schemas/section-editor.schema';
import type { SectionEditorFormValues } from '../schemas/section-editor.schema';
import { DataFieldsEditor } from './DataFieldsEditor';
import { LocaleTabs } from './LocaleTabs';
import { PreviewToggle } from './PreviewToggle';
import { SectionImageField } from './SectionImageField';
import type { SectionImage } from './SectionImageField';

/** Payload handed to `onSaveDraft` — `dataJson` already resolved (structured object, parsed raw JSON, or omitted). */
export type SectionDraftPayload = Omit<SectionEditorFormValues, 'dataJsonRaw' | 'locale'>;

interface SectionEditorFormProps {
  page: string;
  sectionKey: string;
  activeLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
  availableLocales: Locale[];
  section: PageSectionDto | null;
  /** The base-locale (FR) row of this section — present when editing a translation, whose images/list structure it owns. */
  baseSection?: PageSectionDto | null | undefined;
  isLoading: boolean;
  onSaveDraft: (values: SectionDraftPayload) => void;
  isSaving: boolean;
  onPublish: () => void;
  isPublishing: boolean;
  onShowHistory: () => void;
  /** Lets the parent guard navigation (section/locale switch) while there are unsaved edits. */
  onDirtyChange?: (isDirty: boolean) => void;
}

const TEXT_FIELD_ORDER: TextFieldName[] = ['titleText', 'subtitleText', 'bodyText', 'ctaPrimaryLabel', 'ctaSecondaryLabel'];
const INPUT_CLASSES = 'w-full p-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-angaly-navy';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

const emptyValues = (locale: Locale, useRawJson: boolean): SectionEditorFormValues => ({
  locale,
  titleText: '',
  subtitleText: '',
  bodyText: '',
  ctaPrimaryLabel: '',
  ctaSecondaryLabel: '',
  mediaId: null,
  dataJson: {},
  ...(useRawJson ? { dataJsonRaw: '' } : {}),
});

export const SectionEditorForm: React.FC<SectionEditorFormProps> = ({
  page,
  sectionKey,
  activeLocale,
  onLocaleChange,
  availableLocales,
  section,
  baseSection,
  isLoading,
  onSaveDraft,
  isSaving,
  onPublish,
  isPublishing,
  onShowHistory,
  onDirtyChange,
}) => {
  const pageDefinition = findPageDefinition(page);
  const definition = findSectionDefinition(page, sectionKey);
  // A section the catalogue doesn't describe gets every text field + a raw JSON box, so nothing stored is unreachable.
  const textFields = definition?.text ?? GENERIC_TEXT_FIELDS;
  const useRawJson = !definition;

  // Editing a translation: images and list structure are inherited from the base (FR) row.
  const base = activeLocale !== Locale.FR && baseSection ? baseSection : null;

  const [previewOpen, setPreviewOpen] = useState(true);
  const [image, setImage] = useState<SectionImage | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isDirty, errors },
  } = useForm<SectionEditorFormValues>({
    resolver: zodResolver(sectionEditorSchema),
    defaultValues: emptyValues(activeLocale, useRawJson),
  });

  useEffect(() => {
    const stored = asRecord(section?.dataJson);
    reset(
      section
        ? {
            locale: activeLocale,
            titleText: section.titleText ?? '',
            subtitleText: section.subtitleText ?? '',
            bodyText: section.bodyText ?? '',
            ctaPrimaryLabel: section.ctaPrimaryLabel ?? '',
            ctaSecondaryLabel: section.ctaSecondaryLabel ?? '',
            mediaId: section.mediaId,
            dataJson: stored ?? {},
            ...(useRawJson ? { dataJsonRaw: stored ? JSON.stringify(stored, null, 2) : '' } : {}),
          }
        : emptyValues(activeLocale, useRawJson),
    );
    const shownMedia = base ? base.media : (section?.media ?? null);
    setImage(shownMedia ? { url: shownMedia.url, altText: shownMedia.altText } : null);
  }, [section, base, activeLocale, reset, useRawJson]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // The preview subscribes to the whole form: it is the one consumer that needs every keystroke.
  const watched = useWatch({ control });

  const submit = (values: SectionEditorFormValues) => {
    const dataJson = resolveDataJson(values);
    onSaveDraft({
      titleText: values.titleText,
      subtitleText: values.subtitleText,
      bodyText: values.bodyText,
      ctaPrimaryLabel: values.ctaPrimaryLabel,
      ctaSecondaryLabel: values.ctaSecondaryLabel,
      // A translation never owns an image — it always shows the base locale's.
      mediaId: base ? null : values.mediaId,
      ...(dataJson !== undefined ? { dataJson } : {}),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-serif text-xl text-angaly-navy">
            {pageDefinition?.label ?? page} <span className="text-angaly-slate">&gt;</span> {definition?.label ?? sectionKey}
          </h2>
        </div>
        <button type="button" onClick={onShowHistory} className="text-xs text-angaly-slate hover:text-angaly-navy underline">
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
            void handleSubmit(submit)(e);
          }}
          className="mt-6 space-y-5"
        >
          {!section && (
            <p className="rounded-lg bg-angaly-ivory p-3 text-xs text-angaly-slate">
              Cette section n’existe pas encore en {activeLocale === Locale.FR ? 'français' : 'malagasy'} : enregistrez un brouillon pour la
              créer. Tant qu’elle n’est pas publiée, le site affiche son contenu par défaut.
            </p>
          )}

          {definition?.image !== undefined && (
            <Controller
              control={control}
              name="mediaId"
              render={({ field }) => (
                <SectionImageField
                  label={definition.image ?? 'Image'}
                  image={image}
                  lockedNote={base ? 'Image partagée avec le français — à modifier dans l’onglet Français.' : undefined}
                  onPick={(media) => {
                    setImage({ url: media.url, altText: media.altText });
                    field.onChange(media.id);
                  }}
                  onClear={() => {
                    setImage(null);
                    field.onChange(null);
                  }}
                />
              )}
            />
          )}

          {TEXT_FIELD_ORDER.filter((name) => textFields[name]).map((name) => {
            const field = textFields[name]!;
            return (
              <div key={name}>
                <label className="block text-xs font-medium text-angaly-slate mb-1" htmlFor={name}>
                  {field.label}
                </label>
                {field.multiline ? (
                  <textarea id={name} rows={5} placeholder={base?.[name] ?? undefined} {...register(name)} className={INPUT_CLASSES} />
                ) : (
                  <input id={name} placeholder={base?.[name] ?? undefined} {...register(name)} className={INPUT_CLASSES} />
                )}
                {field.hint && <p className="mt-1 text-xs text-angaly-slate">{field.hint}</p>}
                {errors[name] && (
                  <p role="alert" className="mt-1 text-xs text-angaly-error">
                    {errors[name]?.message}
                  </p>
                )}
              </div>
            );
          })}

          {definition?.data && definition.data.length > 0 && (
            <Controller
              control={control}
              name="dataJson"
              render={({ field }) => (
                <DataFieldsEditor
                  fields={definition.data ?? []}
                  value={asRecord(field.value) ?? {}}
                  onChange={field.onChange}
                  baseValue={base ? (asObject(base.dataJson) ?? {}) : undefined}
                />
              )}
            />
          )}

          {useRawJson && (
            <div>
              <label className="block text-xs font-medium text-angaly-slate mb-1" htmlFor="dataJsonRaw">
                Données avancées (JSON)
              </label>
              <textarea id="dataJsonRaw" rows={6} spellCheck={false} {...register('dataJsonRaw')} className={`${INPUT_CLASSES} font-mono`} />
              {errors.dataJsonRaw && (
                <p role="alert" className="mt-1 text-xs text-angaly-error">
                  {errors.dataJsonRaw.message}
                </p>
              )}
            </div>
          )}

          <PreviewToggle
            isOpen={previewOpen}
            onToggle={() => setPreviewOpen((v) => !v)}
            content={{
              titleText: base ? pickText(watched.titleText, base.titleText) : watched.titleText,
              subtitleText: base ? pickText(watched.subtitleText, base.subtitleText) : watched.subtitleText,
              bodyText: base ? pickText(watched.bodyText, base.bodyText) : watched.bodyText,
              ctaPrimaryLabel: base ? pickText(watched.ctaPrimaryLabel, base.ctaPrimaryLabel) : watched.ctaPrimaryLabel,
              ctaSecondaryLabel: base ? pickText(watched.ctaSecondaryLabel, base.ctaSecondaryLabel) : watched.ctaSecondaryLabel,
              dataJson: base ? mergeTranslatedData(base.dataJson, watched.dataJson) : asRecord(watched.dataJson),
            }}
            image={image}
            definition={definition}
            publicHref={pageDefinition?.route}
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

