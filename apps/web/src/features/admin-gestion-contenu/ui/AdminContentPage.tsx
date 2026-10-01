'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Locale } from '@angaly/types';

import { useSectionEditor } from '../hooks/useSectionEditor';
import { useSectionsList } from '../hooks/useSectionsList';
import { useSectionVersionHistory } from '../hooks/useSectionVersionHistory';
import { mergeSectionCatalog } from '../utils/merge-section-catalog';
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

  const pages = useMemo(() => mergeSectionCatalog(groups ?? []), [groups]);

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
    <div className="space-y-6">
      <div className="border-b border-angaly-border pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-angaly-navy font-normal tracking-wide mb-1.5">
            Gestion de contenu
          </h1>
          <p className="text-angaly-slate text-sm font-medium">
            Modifiez les textes et images affichés sur le site public.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row bg-white border border-angaly-border rounded-sm shadow-sm overflow-hidden">
        <div className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-angaly-border bg-angaly-ivory/30 flex flex-col">
          <SectionsList
            pages={pages}
            isLoading={isLoadingGroups}
            selected={selected}
            onSelect={selectSection}
          />
        </div>

        <div className="flex-1 bg-white min-w-0">
          {selected ? (
            <SectionEditorForm
              page={selected.page}
              sectionKey={selected.sectionKey}
              activeLocale={activeLocale}
              onLocaleChange={changeLocale}
              availableLocales={editor.availableLocales}
              section={editor.activeSection}
              baseSection={editor.baseSection}
              isLoading={editor.isLoading}
              onSaveDraft={(values) => editor.saveDraft.mutate(values)}
              isSaving={editor.saveDraft.isPending}
              onPublish={() => editor.publish.mutate()}
              isPublishing={editor.publish.isPending}
              onShowHistory={() => setHistoryOpen(true)}
              onDirtyChange={setIsFormDirty}
            />
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-angaly-slate font-medium">Sélectionnez une section à gauche pour commencer.</p>
            </div>
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
