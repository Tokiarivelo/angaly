'use client';

import React, { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Locale } from '@angaly/types';

import { ChevronRight, History, UploadCloud } from 'lucide-react';

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
const INPUT_CLASSES = 'w-full p-2.5 border border-angaly-border rounded-sm text-sm focus:outline-none focus:border-angaly-gold focus:ring-1 focus:ring-angaly-gold bg-white text-angaly-navy transition-colors';

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
    <div className="flex flex-col min-h-full">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-6 sm:px-8 py-4 border-b border-angaly-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-angaly-slate uppercase tracking-wider mb-1">
            <span>{pageDefinition?.label ?? page}</span>
            <ChevronRight size={12} className="text-angaly-warm-gray" />
            <span className="text-angaly-navy font-bold">{definition?.label ?? sectionKey}</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-xl sm:text-2xl text-angaly-navy tracking-wide">
              {definition?.label ?? sectionKey}
            </h2>
            {isDirty && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-angaly-warning/10 text-angaly-warning border border-angaly-warning/30 rounded-sm">
                Modifié
              </span>
            )}
          </div>
        </div>
        <LocaleTabs activeLocale={activeLocale} onChange={onLocaleChange} availableLocales={availableLocales} />
      </div>

      {isLoading ? (
        <div className="p-8 space-y-6">
          <div className="h-10 w-full animate-pulse rounded-sm bg-angaly-warm-ivory/50" />
          <div className="h-10 w-full animate-pulse rounded-sm bg-angaly-warm-ivory/50" />
          <div className="h-32 w-full animate-pulse rounded-sm bg-angaly-warm-ivory/50" />
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            void handleSubmit(submit)(e);
          }}
          className="flex-1 flex flex-col justify-between"
        >
          <div className="p-6 sm:p-8 space-y-8">
            {!section && (
              <div className="rounded-sm bg-angaly-ivory/80 border border-angaly-border p-4 text-xs text-angaly-slate font-medium">
                Cette section n’existe pas encore en {activeLocale === Locale.FR ? 'français' : 'malagasy'} : enregistrez un brouillon pour la
                créer. Tant qu’elle n’est pas publiée, le site affiche son contenu par défaut.
              </div>
            )}

            {/* Media Section if image is supported */}
            {definition?.image !== undefined && (
              <section className="bg-white p-6 sm:p-8 border border-angaly-border shadow-sm rounded-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-angaly-navy border-b border-angaly-border pb-3 mb-6">
                  Média d&apos;arrière-plan
                </h3>
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
              </section>
            )}

            {/* Text Content Section */}
            {TEXT_FIELD_ORDER.some((name) => textFields[name]) && (
              <section className="bg-white p-6 sm:p-8 border border-angaly-border shadow-sm rounded-sm space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-angaly-navy border-b border-angaly-border pb-3 mb-6">
                  Contenu Textuel
                </h3>
                <div className="space-y-6">
                  {TEXT_FIELD_ORDER.filter((name) => textFields[name]).map((name) => {
                    const field = textFields[name]!;
                    const isTitle = name === 'titleText';
                    return (
                      <div key={name}>
                        <div className="mb-2 flex items-end justify-between">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate" htmlFor={name}>
                            {field.label}
                          </label>
                          {isTitle && (
                            <span className="text-[10px] font-medium text-angaly-gold">Prévisualisation Serif active</span>
                          )}
                        </div>
                        {field.multiline ? (
                          <textarea
                            id={name}
                            rows={isTitle ? 2 : 4}
                            placeholder={base?.[name] ?? undefined}
                            {...register(name)}
                            className={
                              isTitle
                                ? 'w-full bg-angaly-ivory/30 border border-angaly-border focus:border-angaly-gold focus:ring-1 focus:ring-angaly-gold focus:bg-white rounded-sm px-4 py-3 font-heading text-2xl sm:text-3xl text-angaly-navy leading-tight transition-colors resize-none focus:outline-none'
                                : INPUT_CLASSES
                            }
                          />
                        ) : (
                          <input
                            id={name}
                            placeholder={base?.[name] ?? undefined}
                            {...register(name)}
                            className={
                              isTitle
                                ? 'w-full bg-angaly-ivory/30 border border-angaly-border focus:border-angaly-gold focus:ring-1 focus:ring-angaly-gold focus:bg-white rounded-sm px-4 py-3 font-heading text-2xl text-angaly-navy transition-colors focus:outline-none'
                                : INPUT_CLASSES
                            }
                          />
                        )}
                        {field.hint && <p className="mt-1.5 text-xs text-angaly-slate">{field.hint}</p>}
                        {errors[name] && (
                          <p role="alert" className="mt-1.5 text-xs text-angaly-error font-medium">
                            {errors[name]?.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Structured Data Section */}
            {definition?.data && definition.data.length > 0 && (
              <section className="bg-white p-6 sm:p-8 border border-angaly-border shadow-sm rounded-sm space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-angaly-navy border-b border-angaly-border pb-3 mb-6">
                  Données Structurées
                </h3>
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
              </section>
            )}

            {/* Advanced JSON if unknown section */}
            {useRawJson && (
              <section className="bg-white p-6 sm:p-8 border border-angaly-border shadow-sm rounded-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-angaly-navy border-b border-angaly-border pb-3 mb-6">
                  Données Avancées (JSON)
                </h3>
                <div>
                  <label className="block text-[11px] font-semibold text-angaly-slate uppercase tracking-wider mb-2" htmlFor="dataJsonRaw">
                    Données avancées (JSON)
                  </label>
                  <textarea id="dataJsonRaw" rows={6} spellCheck={false} {...register('dataJsonRaw')} className={`${INPUT_CLASSES} font-mono`} />
                  {errors.dataJsonRaw && (
                    <p role="alert" className="mt-1.5 text-xs text-angaly-error font-medium">
                      {errors.dataJsonRaw.message}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Section Preview */}
            <div className="bg-white p-6 sm:p-8 border border-angaly-border shadow-sm rounded-sm">
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
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-angaly-border px-6 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-20">
            <button
              type="button"
              onClick={onShowHistory}
              className="text-xs font-semibold uppercase tracking-wider text-angaly-slate hover:text-angaly-navy flex items-center gap-2 transition-colors"
            >
              <History size={16} />
              <span>Voir l&apos;historique des versions</span>
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border border-angaly-navy text-angaly-navy hover:bg-angaly-ivory transition-colors duration-300 rounded-sm bg-white disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement…' : 'Enregistrer comme brouillon'}
              </button>
              <button
                type="button"
                disabled={isPublishing || !section}
                onClick={onPublish}
                aria-describedby={!section ? 'publish-disabled-hint' : undefined}
                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-angaly-navy text-white hover:bg-angaly-navy-blue transition-colors duration-300 rounded-sm shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <UploadCloud size={16} />
                <span>{isPublishing ? 'Publication…' : 'Publier les modifications'}</span>
              </button>
              {!section && (
                <p id="publish-disabled-hint" className="text-xs text-angaly-slate self-center font-medium">
                  Enregistrez un brouillon avant de publier.
                </p>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

