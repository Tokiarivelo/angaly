import { useState } from 'react';
import { useSaveDraftMutation, useSubmitDesignBriefMutation } from '../api/design-briefs.api';
import type { DesignBriefPayload } from '../types/design-brief.types';

export function useSubmitDesignBrief(creationSlug: string) {
  const [draftId, setDraftId] = useState<string | undefined>();
  const saveDraftMutation = useSaveDraftMutation();
  const submitMutation = useSubmitDesignBriefMutation();

  const handleSaveDraft = async (payload: Omit<DesignBriefPayload, 'status' | 'creationSlug'>) => {
    const fullPayload: DesignBriefPayload = {
      ...payload,
      creationSlug,
      status: 'DRAFT',
    };
    const response = await saveDraftMutation.mutateAsync({ ...(draftId ? { id: draftId } : {}), payload: fullPayload });
    setDraftId(response.id);
    return response;
  };

  const handleSubmit = async (payload: Omit<DesignBriefPayload, 'status' | 'creationSlug'>) => {
    const fullPayload: DesignBriefPayload = {
      ...payload,
      creationSlug,
      status: 'SUBMITTED',
    };
    const response = await submitMutation.mutateAsync({ ...(draftId ? { id: draftId } : {}), payload: fullPayload });
    return response;
  };

  return {
    handleSaveDraft,
    handleSubmit,
    isSavingDraft: saveDraftMutation.isPending,
    isSubmitting: submitMutation.isPending,
    draftId,
  };
}
