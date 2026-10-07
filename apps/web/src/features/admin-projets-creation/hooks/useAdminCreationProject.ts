'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CREATION_PROJECT_STAGES_ORDER,
  CreationProjectStage,
  type GenerateCreationProjectAiPatternInput,
} from '@angaly/types';
import { apiClient } from '@/lib/api-client';

import { adminCreationProjectsApi } from '../api/admin-creation-projects.api';
import { ADMIN_CREATION_PROJECTS_QUERY_KEYS } from '../consts/queryKeys';

function parseStageFromParam(param: string | null | undefined): CreationProjectStage | null {
  if (!param) return null;
  const normalized = param.trim().toUpperCase();
  return CREATION_PROJECT_STAGES_ORDER.includes(normalized as CreationProjectStage)
    ? (normalized as CreationProjectStage)
    : null;
}

async function uploadFileToMinio(file: File): Promise<string> {
  try {
    const presigned = await apiClient.post<{ uploadUrl: string; bucket: string; objectKey: string }>(
      '/media/presigned-upload',
      {
        entityType: 'CREATION',
        originalFilename: file.name,
        mimeType: file.type || 'application/octet-stream',
      },
    );

    const uploadResponse = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });

    if (uploadResponse.ok) {
      const confirmed = await apiClient.post<{ url: string }>('/media/confirm', {
        bucket: presigned.bucket,
        objectKey: presigned.objectKey,
        entityType: 'CREATION',
        altText: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      });
      return confirmed.url;
    }
  } catch {
    // Graceful fallback for mock/offline environments
  }
  return typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : `https://storage.angaly.mg/creations/${file.name}`;
}

/** Détail d'un projet (+ historique, notes d'atelier, médias), assignation, passage d'étape et patronage IA. */
export function useAdminCreationProject(id: string) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const queryStage = useMemo(
    () => parseStageFromParam(searchParams?.get('step') ?? searchParams?.get('stage')),
    [searchParams],
  );

  const [activeWorkspaceStage, setActiveWorkspaceStage] = useState<CreationProjectStage | null>(
    () => queryStage,
  );

  // Synchronisation si le paramètre d'URL change (ex: historique navigateur avant/arrière)
  useEffect(() => {
    if (queryStage && queryStage !== activeWorkspaceStage) {
      setActiveWorkspaceStage(queryStage);
    }
  }, [queryStage]);

  const updateUrlStep = useCallback((stage: CreationProjectStage) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const current = url.searchParams.get('step') ?? url.searchParams.get('stage');
      if (current?.toLowerCase() !== stage.toLowerCase()) {
        url.searchParams.set('step', stage.toLowerCase());
        window.history.replaceState(null, '', url.toString());
      }
    }
  }, []);

  const setSelectedStage = useCallback(
    (stage: CreationProjectStage) => {
      setActiveWorkspaceStage(stage);
      updateUrlStep(stage);
    },
    [updateUrlStep],
  );

  const projectQuery = useQuery({
    queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.detail(id),
    queryFn: () => adminCreationProjectsApi.get(id),
  });

  const assigneesQuery = useQuery({
    queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.assignees,
    queryFn: () => adminCreationProjectsApi.listAssignees(),
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.all });

  const updateStageMutation = useMutation({
    mutationFn: (stage: CreationProjectStage) => adminCreationProjectsApi.updateStage(id, stage),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string | null) => adminCreationProjectsApi.assign(id, userId),
    onSuccess: invalidate,
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ stage, content }: { stage: CreationProjectStage; content: string }) =>
      adminCreationProjectsApi.addNote(id, { stage, content }),
    onSuccess: invalidate,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => adminCreationProjectsApi.deleteNote(id, noteId),
    onSuccess: invalidate,
  });

  const addMediaMutation = useMutation({
    mutationFn: (data: {
      stage: CreationProjectStage;
      url: string;
      title?: string | undefined;
      fileName?: string | undefined;
      mimeType?: string | undefined;
      sizeBytes?: number | undefined;
    }) => adminCreationProjectsApi.addMedia(id, data),
    onSuccess: invalidate,
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) => adminCreationProjectsApi.deleteMedia(id, mediaId),
    onSuccess: invalidate,
  });

  const uploadStageMediaMutation = useMutation({
    mutationFn: async ({
      stage,
      file,
      title,
    }: {
      stage: CreationProjectStage;
      file: File;
      title?: string | undefined;
    }) => {
      const url = await uploadFileToMinio(file);
      return adminCreationProjectsApi.addMedia(id, {
        stage,
        url,
        title: title || file.name,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      });
    },
    onSuccess: invalidate,
  });

  const generateAiPatternMutation = useMutation({
    mutationFn: (input: GenerateCreationProjectAiPatternInput) =>
      adminCreationProjectsApi.generateAiPattern(id, input),
    onSuccess: invalidate,
  });

  const currentStage = projectQuery.data?.stage;
  const currentStageIndex = currentStage ? CREATION_PROJECT_STAGES_ORDER.indexOf(currentStage) : -1;
  const nextStage: CreationProjectStage | null =
    currentStageIndex >= 0 && currentStageIndex < CREATION_PROJECT_STAGES_ORDER.length - 1
      ? (CREATION_PROJECT_STAGES_ORDER[currentStageIndex + 1] ?? null)
      : null;

  const selectedStage: CreationProjectStage =
    activeWorkspaceStage ?? queryStage ?? currentStage ?? CreationProjectStage.CONSULTATION;

  // Si aucun paramètre step/stage n'était présent dans l'URL au chargement, on renseigne le paramètre d'étape
  useEffect(() => {
    if (typeof window !== 'undefined' && projectQuery.data?.stage) {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('step') && !url.searchParams.has('stage')) {
        url.searchParams.set('step', selectedStage.toLowerCase());
        window.history.replaceState(null, '', url.toString());
      }
    }
  }, [projectQuery.data?.stage, selectedStage]);

  const goToNextStage = async () => {
    if (!nextStage) return;
    setSelectedStage(nextStage);
    return updateStageMutation.mutateAsync(nextStage);
  };

  return {
    project: projectQuery.data,
    isLoading: projectQuery.isLoading,
    isError: projectQuery.isError,
    error: projectQuery.error,
    refetch: projectQuery.refetch,
    assignees: assigneesQuery.data ?? [],
    updateStage: updateStageMutation.mutateAsync,
    isUpdatingStage: updateStageMutation.isPending,
    nextStage,
    goToNextStage,
    assign: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
    selectedStage,
    setSelectedStage,
    addNote: addNoteMutation.mutateAsync,
    isAddingNote: addNoteMutation.isPending,
    deleteNote: deleteNoteMutation.mutateAsync,
    isDeletingNote: deleteNoteMutation.isPending,
    addMedia: addMediaMutation.mutateAsync,
    isAddingMedia: addMediaMutation.isPending,
    uploadStageMedia: uploadStageMediaMutation.mutateAsync,
    isUploadingMedia: uploadStageMediaMutation.isPending,
    deleteMedia: deleteMediaMutation.mutateAsync,
    isDeletingMedia: deleteMediaMutation.isPending,
    generateAiPattern: generateAiPatternMutation.mutateAsync,
    isGeneratingAiPattern: generateAiPatternMutation.isPending,
    generatedPatternResult: generateAiPatternMutation.data,
    resetGeneratedPattern: generateAiPatternMutation.reset,
    generateAiPatternError: generateAiPatternMutation.error,
  };
}
