'use client';

import React, { useState } from 'react';
import { MediaEntityType } from '@angaly/types';

import { MEDIA_FOLDERS } from '../consts/media-folders.const';
import { useDeleteMedia } from '../hooks/useDeleteMedia';
import { useMediaDetail } from '../hooks/useMediaDetail';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import { useMediaSelection } from '../hooks/useMediaSelection';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { useReplaceMedia } from '../hooks/useReplaceMedia';
import { useUpdateMediaAlt } from '../hooks/useUpdateMediaAlt';
import { MediaBulkActionsBar } from './MediaBulkActionsBar';
import { MediaDetailPanel } from './MediaDetailPanel';
import { MediaEmptyState } from './MediaEmptyState';
import { MediaFolderFilterChips } from './MediaFolderFilterChips';
import { MediaGrid } from './MediaGrid';
import { MediaSearchBar } from './MediaSearchBar';
import { MediaSortControl } from './MediaSortControl';
import { MediaUploadDropzone } from './MediaUploadDropzone';

interface AdminMediathequePageProps {
  /** Optional deep-link, e.g. `?folder=creations` (docs/pages/admin-mediatheque.md). */
  initialFolderId?: string | undefined;
}

export const AdminMediathequePage: React.FC<AdminMediathequePageProps> = ({ initialFolderId }) => {
  const [folderId, setFolderId] = useState(initialFolderId ?? 'toutes');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const activeFolder = MEDIA_FOLDERS.find((folder) => folder.id === folderId) ?? MEDIA_FOLDERS[0];
  // Upload always targets a concrete folder — "Toutes" falls back to CREATION,
  // the most common case, rather than blocking the import button entirely.
  const uploadEntityType = activeFolder?.entityType ?? MediaEntityType.CREATION;

  const library = useMediaLibrary({ folderId, search, sortBy, page }, activeFolder?.entityType ?? null);
  const selection = useMediaSelection();
  const upload = useMediaUpload(uploadEntityType);
  const detail = useMediaDetail(selectedMediaId);
  const updateAlt = useUpdateMediaAlt(selectedMediaId ?? '');
  const replaceMedia = useReplaceMedia(selectedMediaId ?? '', uploadEntityType);
  const deleteMedia = useDeleteMedia();

  const items = library.data?.data ?? [];

  function handleDelete(id: string) {
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

  return (
    <div>
      <h1 className="font-serif text-2xl sm:text-3xl text-primary-deep-navy font-light mb-2">Médiathèque</h1>
      <p className="text-slate text-sm mb-6">Gérez toutes les images et vidéos utilisées sur le site.</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <MediaUploadDropzone onFilesSelected={(files) => void upload.uploadFiles(files)} isUploading={upload.isUploading} />
        <MediaSearchBar value={search} onChange={setSearch} />
        <MediaSortControl sortBy={sortBy} onSortChange={setSortBy} view={view} onViewChange={setView} />
      </div>

      <div className="mb-4">
        <MediaFolderFilterChips
          activeFolderId={folderId}
          onChange={(id) => {
            setFolderId(id);
            setPage(1);
          }}
        />
      </div>

      {selection.count > 0 && (
        <div className="mb-4">
          <MediaBulkActionsBar
            count={selection.count}
            onDownload={() => {
              selection.selectedIds.forEach((id) => {
                const media = items.find((item) => item.id === id);
                if (media) window.open(media.url, '_blank');
              });
            }}
            onDelete={() => {
              selection.selectedIds.forEach((id) => handleDelete(id));
              selection.clear();
            }}
            onClear={selection.clear}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {library.isLoading ? (
            <p className="text-sm text-slate">Chargement…</p>
          ) : items.length === 0 ? (
            <MediaEmptyState onFilesSelected={(files) => void upload.uploadFiles(files)} isUploading={upload.isUploading} />
          ) : (
            <MediaGrid
              items={items}
              selectedIds={selection.selectedIds}
              onToggleSelect={selection.toggle}
              onOpen={setSelectedMediaId}
            />
          )}

          {library.data && library.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6 text-sm">
              <button
                type="button"
                disabled={!library.data.meta.hasPreviousPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-slate">
                Page {library.data.meta.page} / {library.data.meta.totalPages}
              </span>
              <button
                type="button"
                disabled={!library.data.meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
        </div>

        {selectedMediaId && (
          <MediaDetailPanel
            media={detail.data ?? null}
            isLoading={detail.isLoading}
            onClose={() => setSelectedMediaId(null)}
            onSaveAltText={(altText) => updateAlt.mutate(altText)}
            isSavingAltText={updateAlt.isPending}
            onReplace={(file) => replaceMedia.mutate(file)}
            isReplacing={replaceMedia.isPending}
            onDelete={() => handleDelete(selectedMediaId)}
            isDeleting={deleteMedia.isPending}
            deleteErrorMessage={deleteError}
          />
        )}
      </div>
    </div>
  );
};
