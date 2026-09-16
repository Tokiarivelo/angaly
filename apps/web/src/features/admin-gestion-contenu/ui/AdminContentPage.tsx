'use client';

import React, { useEffect, useState } from 'react';
import { Locale } from '@angaly/types';

import { useSectionEditor } from '../hooks/useSectionEditor';
import { useSectionsList } from '../hooks/useSectionsList';
import { useSectionVersionHistory } from '../hooks/useSectionVersionHistory';
import { SectionsList } from './SectionsList';
import { SectionEditorForm } from './SectionEditorForm';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';

interface AdminContentPageProps {
  /** Optional deep-link, e.g. `?page=accueil&section=hero` (docs/pages/admin-gestion-contenu.md). */
  initialPage?: string | undefined;
  initialSectionKey?: string | undefined;
}

const UNSAVED_CHANGES_WARNING =
  'Des modifications non enregistrées seront perdues. Continuer ?';

export const AdminContentPage: React.FC<AdminContentPageProps> = ({ initialPage, initialSectionKey }) => {
  const { data: groups, isLoading: isLoadingGroups } = useSectionsList();
  const [selected, setSelected] = useState<{ page: string; sectionKey: string } | null>(
    initialPage && initialSectionKey ? { page: initialPage, sectionKey: initialSectionKey } : null,
  );
  const [activeLocale, setActiveLocale] = useState<Locale>(Locale.FR);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const editor = useSectionEditor(selected?.page ?? '', selected?.sectionKey ?? '', activeLocale);
  const history = useSectionVersionHistory(editor.activeSection?.id ?? null);

  // Warn on a hard reload/tab close while a draft edit hasn't been saved —
  // useSectionEditor's data would otherwise be silently discarded.
  useEffect(() => {
    if (!isFormDirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  function confirmDiscardIfDirty(): boolean {
    return !isFormDirty || window.confirm(UNSAVED_CHANGES_WARNING);
  }

  function selectSection(page: string, sectionKey: string) {
    if (!confirmDiscardIfDirty()) return;
    setSelected({ page, sectionKey });
    setActiveLocale(Locale.FR);
  }

  function changeLocale(locale: Locale) {
    if (!confirmDiscardIfDirty()) return;
    setActiveLocale(locale);
  }

  return (
    <div>
      <h1 className="font-serif text-2xl sm:text-3xl text-angaly-navy font-light mb-2">
        Gestion de contenu
      </h1>
      <p className="text-angaly-slate text-sm mb-8">
        Modifiez les textes et images affichés sur le site public.
      </p>

      <div className="flex flex-col lg:flex-row gap-6 bg-white border border-border rounded-xl overflow-hidden">
        <div className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-border">
          <SectionsList
            groups={groups ?? []}
            isLoading={isLoadingGroups}
            selected={selected}
            onSelect={selectSection}
          />
        </div>

        <div className="flex-1 p-6">
          {selected ? (
            <SectionEditorForm
              page={selected.page}
              sectionKey={selected.sectionKey}
              activeLocale={activeLocale}
              onLocaleChange={changeLocale}
              availableLocales={editor.availableLocales}
              section={editor.activeSection}
              isLoading={editor.isLoading}
              onSaveDraft={(values) =>
                editor.saveDraft.mutate({
                  titleText: values.titleText,
                  subtitleText: values.subtitleText,
                  bodyText: values.bodyText,
                  ctaPrimaryLabel: values.ctaPrimaryLabel,
                  ctaSecondaryLabel: values.ctaSecondaryLabel,
                  mediaId: values.mediaId,
                })
              }
              isSaving={editor.saveDraft.isPending}
              onPublish={() => editor.publish.mutate()}
              isPublishing={editor.publish.isPending}
              onShowHistory={() => setHistoryOpen(true)}
              onDirtyChange={setIsFormDirty}
            />
          ) : (
            <p className="text-sm text-angaly-slate">Sélectionnez une section à gauche pour commencer.</p>
          )}
        </div>
      </div>

      <VersionHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        versions={history.data ?? []}
        isLoading={history.isLoading}
        onRestore={(versionId) => history.restore.mutate(versionId)}
        isRestoring={history.restore.isPending}
      />
    </div>
  );
};
