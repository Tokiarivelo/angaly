'use client';

import { useState, useMemo } from 'react';

import { CMS_TEMPLATE_PRESETS } from '../consts/template-catalog.const';
import type { CmsTemplatePreset, AddSectionPayload } from '../types/template.types';
import type { CatalogPageEntry } from '../utils/merge-section-catalog';

interface UseTemplateAtelierProps {
  pages: CatalogPageEntry[];
  initialPage?: string | undefined;
  onAddSection: (payload: AddSectionPayload) => void;
  isAdding?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function useTemplateAtelier({
  pages,
  initialPage,
  onAddSection,
  isAdding = false,
}: UseTemplateAtelierProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(CMS_TEMPLATE_PRESETS[0]?.id ?? 'hero-nouvelle-collection');
  const [targetPage, setTargetPage] = useState<string>(initialPage || 'accueil');
  const [customPage, setCustomPage] = useState<string>('');
  const [sectionKey, setSectionKey] = useState<string>('nouvelle-collection');
  const [label, setLabel] = useState<string>('Nouvelle Collection');
  const [hasManuallyEditedKey, setHasManuallyEditedKey] = useState(false);

  // Form customizer values initialized from active preset
  const selectedPreset = useMemo(
    () => CMS_TEMPLATE_PRESETS.find((p) => p.id === selectedPresetId) ?? CMS_TEMPLATE_PRESETS[0]!,
    [selectedPresetId],
  );

  const [customValues, setCustomValues] = useState<{
    titleText: string;
    subtitleText: string;
    bodyText: string;
    ctaPrimaryLabel: string;
    ctaSecondaryLabel: string;
    imageUrl: string;
    imageAlt: string;
    dataJson: Record<string, unknown>;
  }>({
    titleText: selectedPreset.defaultValues.titleText,
    subtitleText: selectedPreset.defaultValues.subtitleText ?? '',
    bodyText: selectedPreset.defaultValues.bodyText ?? '',
    ctaPrimaryLabel: selectedPreset.defaultValues.ctaPrimaryLabel ?? '',
    ctaSecondaryLabel: selectedPreset.defaultValues.ctaSecondaryLabel ?? '',
    imageUrl: selectedPreset.defaultImageUrl ?? '',
    imageAlt: selectedPreset.defaultImageAlt ?? '',
    dataJson: selectedPreset.defaultDataJson,
  });

  const selectPreset = (preset: CmsTemplatePreset) => {
    setSelectedPresetId(preset.id);
    setLabel(preset.name);
    if (!hasManuallyEditedKey) {
      setSectionKey(slugify(preset.name));
    }
    setCustomValues({
      titleText: preset.defaultValues.titleText,
      subtitleText: preset.defaultValues.subtitleText ?? '',
      bodyText: preset.defaultValues.bodyText ?? '',
      ctaPrimaryLabel: preset.defaultValues.ctaPrimaryLabel ?? '',
      ctaSecondaryLabel: preset.defaultValues.ctaSecondaryLabel ?? '',
      imageUrl: preset.defaultImageUrl ?? '',
      imageAlt: preset.defaultImageAlt ?? '',
      dataJson: preset.defaultDataJson,
    });
  };

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    if (!hasManuallyEditedKey) {
      setSectionKey(slugify(newLabel) || 'section');
    }
  };

  const handleSectionKeyChange = (newKey: string) => {
    setHasManuallyEditedKey(true);
    setSectionKey(slugify(newKey));
  };

  const effectivePage = targetPage === '__custom__' ? slugify(customPage) : targetPage;

  const handleAdd = () => {
    if (!effectivePage || !sectionKey) return;
    onAddSection({
      page: effectivePage,
      sectionKey,
      label: label || sectionKey,
      kind: selectedPreset.kind,
      titleText: customValues.titleText,
      subtitleText: customValues.subtitleText || null,
      bodyText: customValues.bodyText || null,
      ctaPrimaryLabel: customValues.ctaPrimaryLabel || null,
      ctaSecondaryLabel: customValues.ctaSecondaryLabel || null,
      imageUrl: customValues.imageUrl || null,
      imageAlt: customValues.imageAlt || null,
      dataJson: {
        ...customValues.dataJson,
        templateKind: selectedPreset.kind,
        sectionLabel: label,
      },
    });
  };

  return {
    presets: CMS_TEMPLATE_PRESETS,
    selectedPreset,
    selectPreset,
    targetPage,
    setTargetPage,
    customPage,
    setCustomPage,
    effectivePage,
    sectionKey,
    handleSectionKeyChange,
    label,
    handleLabelChange,
    customValues,
    setCustomValues,
    handleAdd,
    isAdding,
    availablePages: pages,
  };
}
