'use client';

import { useState } from 'react';
import { MediaEntityType } from '@angaly/types';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import { MEDIA_FOLDERS } from '../consts/media-folders.const';
import { useDeleteMedia } from './useDeleteMedia';
import { useMediaDetail } from './useMediaDetail';
import { useMediaLibrary } from './useMediaLibrary';
import { useMediaSelection } from './useMediaSelection';
import { useMediaUpload } from './useMediaUpload';
import { useReplaceMedia } from './useReplaceMedia';
import { useUpdateMediaAlt } from './useUpdateMediaAlt';

const SEARCH_DEBOUNCE_MS = 300;
/** Staggers bulk "Télécharger" `<a download>` clicks so browsers don't pop-up-block a batch fired in the same tick. */
const BULK_DOWNLOAD_STAGGER_MS = 150;

/**
 * Orchestrates `admin-mediatheque` — owns every piece of page-level state and
 * wires the feature's hooks together, so `AdminMediathequePage.tsx` stays a
 * thin, presentational consumer (this repo's rule: logic lives in hooks/,
 * not ui/).
 */
export const useAdminMediathequePage = (initialFolderId?: string) => {
  const [folderId, setFolderId] = useState(initialFolderId ?? 'toutes');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Single-item delete is gated by its own confirm dialog inside
  // MediaDetailPanel; this one is only for the bulk-actions bar, which has
  // no dialog of its own.
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const activeFolder = MEDIA_FOLDERS.find((folder) => folder.id === folderId) ?? MEDIA_FOLDERS[0];
  // Upload always targets a concrete folder — "Toutes" falls back to CREATION,
  // the most common case, rather than blocking the import button entirely.
  const uploadEntityType = activeFolder?.entityType ?? MediaEntityType.CREATION;

  const library = useMediaLibrary(
    { folderId, search: debouncedSearch, sortBy, page },
    activeFolder?.entityType ?? null,
  );
  const selection = useMediaSelection();
  const upload = useMediaUpload(uploadEntityType);
  const detail = useMediaDetail(selectedMediaId);
  const updateAlt = useUpdateMediaAlt(selectedMediaId ?? '');
  const replaceMedia = useReplaceMedia(selectedMediaId ?? '', uploadEntityType);
  const deleteMedia = useDeleteMedia();

  const items = library.data?.data ?? [];
  const hasActiveFilters = folderId !== 'toutes' || debouncedSearch.trim().length > 0;

  function changeFolder(id: string) {
    setFolderId(id);
    setPage(1);
  }

  function resetFilters() {
    setFolderId('toutes');
    setSearch('');
    setPage(1);
  }

  function deleteOne(id: string) {
    setDeleteError(null);
    deleteMedia.mutate(id, {
      onSuccess: () => {
        if (selectedMediaId === id) setSelectedMediaId(null);
      },
      onError: (error) => {
        setDeleteError(
          error instanceof Error ? error.message : 'Ce média est encore référencé et ne peut pas être supprimé.',
        );
      },
    });
  }

  function confirmBulkDelete() {
    selection.selectedIds.forEach((id) => deleteOne(id));
    selection.clear();
    setConfirmBulkDeleteOpen(false);
  }

  function downloadSelected() {
    const ids = Array.from(selection.selectedIds);
    ids.forEach((id, index) => {
      const media = items.find((item) => item.id === id);
      if (!media) return;
      // Staggered, real <a download> clicks — a tight window.open() loop
      // triggers popup blockers with no feedback for anything past the
      // first item.
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = media.url;
        link.download = media.altText ?? media.id;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, index * BULK_DOWNLOAD_STAGGER_MS);
    });
  }

  return {
    // Filters
    folderId,
    search,
    setSearch,
    sortBy,
    setSortBy,
    view,
    setView,
    page,
    setPage,
    changeFolder,
    resetFilters,
    hasActiveFilters,
    // Data
    items,
    library,
    // Selection
    selection,
    // Upload
    upload,
    // Detail panel
    selectedMediaId,
    setSelectedMediaId,
    detail,
    updateAlt,
    replaceMedia,
    // Delete — single-item confirm lives inside MediaDetailPanel; bulk
    // confirm is gated here since MediaBulkActionsBar has no dialog itself.
    deleteOne,
    deleteMedia,
    deleteError,
    confirmBulkDeleteOpen,
    setConfirmBulkDeleteOpen,
    confirmBulkDelete,
    // Bulk actions
    downloadSelected,
  };
};
