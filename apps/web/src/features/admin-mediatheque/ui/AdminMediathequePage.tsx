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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-angaly-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-angaly-navy tracking-wide mb-1 italic">
            Médiathèque
          </h1>
          <p className="text-xs sm:text-sm text-angaly-slate">
            Gérez toutes les images et vidéos utilisées sur le site.
          </p>
        </div>
        <MediaUploadDropzone
          onFilesSelected={(files) => void page.upload.uploadFiles(files)}
          isUploading={page.upload.isUploading}
        />
      </div>

      {/* Toolbar: Filters & Search/Sort */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <MediaFolderFilterChips activeFolderId={page.folderId} onChange={page.changeFolder} />
        <div className="flex flex-wrap items-center gap-3">
          <MediaSearchBar value={page.search} onChange={page.setSearch} />
          <MediaSortControl
            sortBy={page.sortBy}
            onSortChange={page.setSortBy}
            view={page.view}
            onViewChange={page.setView}
          />
        </div>
      </div>

      {/* Upload Progress List */}
      {page.upload.entries.length > 0 && (
        <div className="mb-2">
          <UploadEntriesList entries={page.upload.entries} onDismiss={page.upload.clearEntries} />
        </div>
      )}

      {/* Bulk Actions Floating Bar */}
      {page.selection.count > 0 && (
        <div className="sticky top-2 z-30">
          <MediaBulkActionsBar
            count={page.selection.count}
            onDownload={page.downloadSelected}
            onDelete={() => page.setConfirmBulkDeleteOpen(true)}
            onClear={page.selection.clear}
          />
        </div>
      )}

      {/* Main Area: Grid/List and Detail Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full min-w-0">
          {page.library.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="aspect-square rounded-sm bg-angaly-warm-ivory/50" />
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
            <div className="flex items-center justify-center gap-3 mt-8 text-xs font-semibold uppercase tracking-wider">
              <button
                type="button"
                disabled={!page.library.data.meta.hasPreviousPage}
                onClick={() => page.setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-sm border border-angaly-border bg-white text-angaly-navy hover:bg-angaly-ivory transition-colors disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                Précédent
              </button>
              <span className="text-angaly-slate px-2">
                Page {page.library.data.meta.page} / {page.library.data.meta.totalPages}
              </span>
              <button
                type="button"
                disabled={!page.library.data.meta.hasNextPage}
                onClick={() => page.setPage((p) => p + 1)}
                className="px-4 py-2 rounded-sm border border-angaly-border bg-white text-angaly-navy hover:bg-angaly-ivory transition-colors disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
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
