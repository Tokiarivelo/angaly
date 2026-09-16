'use client';

import React from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { useAdminMediathequePage } from '../hooks/useAdminMediathequePage';
import { MediaBulkActionsBar } from './MediaBulkActionsBar';
import { MediaDetailPanel } from './MediaDetailPanel';
import { MediaEmptyState } from './MediaEmptyState';
import { MediaFolderFilterChips } from './MediaFolderFilterChips';
import { MediaGrid } from './MediaGrid';
import { MediaListView } from './MediaListView';
import { MediaNoResultsState } from './MediaNoResultsState';
import { MediaSearchBar } from './MediaSearchBar';
import { MediaSortControl } from './MediaSortControl';
import { MediaUploadDropzone } from './MediaUploadDropzone';
import { UploadEntriesList } from './UploadEntriesList';

interface AdminMediathequePageProps {
  /** Optional deep-link, e.g. `?folder=creations` (docs/pages/admin-mediatheque.md). */
  initialFolderId?: string | undefined;
}

export const AdminMediathequePage: React.FC<AdminMediathequePageProps> = ({ initialFolderId }) => {
  const page = useAdminMediathequePage(initialFolderId);

  return (
    <div>
      <h1 className="font-serif text-2xl sm:text-3xl text-angaly-navy font-light mb-2">Médiathèque</h1>
      <p className="text-angaly-slate text-sm mb-6">Gérez toutes les images et vidéos utilisées sur le site.</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <MediaUploadDropzone
          onFilesSelected={(files) => void page.upload.uploadFiles(files)}
          isUploading={page.upload.isUploading}
        />
        <MediaSearchBar value={page.search} onChange={page.setSearch} />
        <MediaSortControl
          sortBy={page.sortBy}
          onSortChange={page.setSortBy}
          view={page.view}
          onViewChange={page.setView}
        />
      </div>

      {page.upload.entries.length > 0 && (
        <div className="mb-4">
          <UploadEntriesList entries={page.upload.entries} onDismiss={page.upload.clearEntries} />
        </div>
      )}

      <div className="mb-4">
        <MediaFolderFilterChips activeFolderId={page.folderId} onChange={page.changeFolder} />
      </div>

      {page.selection.count > 0 && (
        <div className="mb-4">
          <MediaBulkActionsBar
            count={page.selection.count}
            onDownload={page.downloadSelected}
            onDelete={() => page.setConfirmBulkDeleteOpen(true)}
            onClear={page.selection.clear}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {page.library.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : page.items.length === 0 ? (
            page.hasActiveFilters ? (
              <MediaNoResultsState onResetFilters={page.resetFilters} />
            ) : (
              <MediaEmptyState
                onFilesSelected={(files) => void page.upload.uploadFiles(files)}
                isUploading={page.upload.isUploading}
              />
            )
          ) : page.view === 'grid' ? (
            <MediaGrid
              items={page.items}
              selectedIds={page.selection.selectedIds}
              onToggleSelect={page.selection.toggle}
              onOpen={page.setSelectedMediaId}
            />
          ) : (
            <MediaListView
              items={page.items}
              selectedIds={page.selection.selectedIds}
              onToggleSelect={page.selection.toggle}
              onOpen={page.setSelectedMediaId}
            />
          )}

          {page.library.data && page.library.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6 text-sm">
              <button
                type="button"
                disabled={!page.library.data.meta.hasPreviousPage}
                onClick={() => page.setPage((p) => Math.max(1, p - 1))}
                className="disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-angaly-slate">
                Page {page.library.data.meta.page} / {page.library.data.meta.totalPages}
              </span>
              <button
                type="button"
                disabled={!page.library.data.meta.hasNextPage}
                onClick={() => page.setPage((p) => p + 1)}
                className="disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
        </div>

        {page.selectedMediaId && (
          <MediaDetailPanel
            media={page.detail.data ?? null}
            isLoading={page.detail.isLoading}
            onClose={() => page.setSelectedMediaId(null)}
            onSaveAltText={(altText) => page.updateAlt.mutate(altText)}
            isSavingAltText={page.updateAlt.isPending}
            onReplace={(file) => page.replaceMedia.mutate(file)}
            isReplacing={page.replaceMedia.isPending}
            onDelete={() => page.deleteOne(page.selectedMediaId as string)}
            isDeleting={page.deleteMedia.isPending}
            deleteErrorMessage={page.deleteError}
          />
        )}
      </div>

      <ConfirmDialog
        open={page.confirmBulkDeleteOpen}
        onOpenChange={page.setConfirmBulkDeleteOpen}
        title={`Supprimer ${page.selection.count} fichier${page.selection.count > 1 ? 's' : ''} ?`}
        description="Cette action est définitive et ne peut pas être annulée. Les fichiers encore référencés ne seront pas supprimés."
        confirmLabel="Supprimer"
        variant="destructive"
        isConfirming={page.deleteMedia.isPending}
        onConfirm={page.confirmBulkDelete}
      />
    </div>
  );
};
