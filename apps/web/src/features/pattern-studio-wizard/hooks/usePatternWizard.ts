'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchPatternProject, updatePatternProject } from '../api/pattern-projects.api';
import { validateMeasurementValues, type GarmentProfile } from '@angaly/types';
import { WIZARD_STEPS, stepKeyAt, type WizardFormData } from '../types/wizard-state.types';

export const PATTERN_PROJECT_DETAIL_KEY = (id: string) => ['pattern-project', id];

export const usePatternWizard = (projectId: string) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // `?step=<key>` makes a refresh resume on the same step (form data is autosaved server-side).
  const [currentStep, setCurrentStep] = useState<number>(
    () => WIZARD_STEPS.find((step) => step.key === searchParams.get('step'))?.index ?? 1,
  );

  useEffect(() => {
    const key = stepKeyAt(currentStep);
    if (!key || searchParams.get('step') === key) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentStep, pathname, router, searchParams]);
  const [formData, setFormData] = useState<WizardFormData>({
    garmentType: 'ROBE',
    occasion: '',
    style: '',
    cutType: '',
    details: {},
  });

  // Query project initial data
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: PATTERN_PROJECT_DETAIL_KEY(projectId),
    queryFn: () => fetchPatternProject(projectId),
    enabled: Boolean(projectId),
    staleTime: 1000 * 60,
  });

  // Hydrate formData from fetched project
  useEffect(() => {
    if (project) {
      setFormData((prev) => ({
        ...prev,
        garmentType: project.garmentType ? project.garmentType : prev.garmentType,
        occasion: project.occasion ?? prev.occasion,
        style: project.style ?? prev.style,
        cutType: project.cutType ?? prev.cutType,
        details: project.detailsJson ?? prev.details,
        measurementProfileId: project.measurementProfileId ?? prev.measurementProfileId,
        fit: project.parametersExtJson ?? prev.fit,
        ...(project.inspirationAnalysisJson
          ? {
              inspirationAnalysis: project.inspirationAnalysisJson,
              detectedFeatures: project.inspirationAnalysisJson.features,
              inspirationProfile: project.inspirationAnalysisJson.profile ?? undefined,
              inspirationIsGarment: project.inspirationAnalysisJson.profile?.isGarment,
            }
          : {}),
        ...(project.inspirationMediaId
          ? {
              inspirationMediaId: project.inspirationMediaId,
              inspirationImageUrl: project.inspirationMediaUrl ?? prev.inspirationImageUrl,
            }
          : {}),
      }));
    }
  }, [project]);

  // Autosave mutation
  const { mutate: autoSave } = useMutation({
    mutationFn: (updated: Partial<WizardFormData>) =>
      updatePatternProject(projectId, {
        garmentType: updated.garmentType,
        occasion: updated.occasion,
        style: updated.style,
        cutType: updated.cutType,
        detailsJson: updated.details,
        inspirationMediaId: updated.inspirationMediaId,
        inspirationAnalysisJson: updated.inspirationAnalysis,
        measurementProfileId: updated.measurementProfileId,
        parametersExtJson: updated.fit,
      }),
  });

  const updateField = useCallback(
    <K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        autoSave(next);
        return next;
      });
    },
    [autoSave],
  );

  const updateDetail = useCallback(
    (key: string, value: string) => {
      setFormData((prev) => {
        const updatedDetails = { ...prev.details, [key]: value };
        const next = { ...prev, details: updatedDetails };
        autoSave(next);
        return next;
      });
    },
    [autoSave],
  );

  /**
   * Applies a photo analysis in one state update (and one autosave): a recognised garment
   * pre-fills garment type, occasion, style, cut and details; anything else only stores the photo.
   */
  const applyInspiration = useCallback(
    (inspiration: {
      mediaId: string;
      url: string;
      detectedFeatures: Record<string, string>;
      profile: GarmentProfile | null;
      suggestedCutType: string | null;
    }) => {
      setFormData((prev) => {
        const { profile } = inspiration;
        const recognised = profile?.isGarment === true;
        const next: WizardFormData = {
          ...prev,
          inspirationMediaId: inspiration.mediaId,
          inspirationImageUrl: inspiration.url,
          detectedFeatures: inspiration.detectedFeatures,
          inspirationIsGarment: profile ? profile.isGarment : undefined,
          inspirationProfile: profile ?? undefined,
          inspirationAnalysis: { features: inspiration.detectedFeatures, profile },
          ...(recognised && profile
            ? {
                garmentType: profile.garmentType ?? prev.garmentType,
                occasion: profile.occasion ?? prev.occasion,
                style: profile.style ?? prev.style,
                cutType: profile.cutType ?? prev.cutType,
                details: { ...prev.details, ...profile.details },
              }
            : inspiration.suggestedCutType && !prev.cutType && !profile
              ? { cutType: inspiration.suggestedCutType }
              : {}),
        };
        autoSave(next);
        return next;
      });
    },
    [autoSave],
  );

  const isStepValid = useCallback(
    (step: number): boolean => {
      switch (stepKeyAt(step)) {
        case 'inspiration':
          return true; // Inspiration photo is optional
        case 'garmentType':
          return Boolean(formData.garmentType);
        case 'occasion':
          return Boolean(formData.occasion);
        case 'style':
          return Boolean(formData.style);
        case 'cut':
          return Boolean(formData.cutType);
        case 'details':
          return true; // Détails are optional/preset
        case 'measurements':
          // Typed values must be plausible (a 9 m waist is a typo, not a body); a saved profile is trusted.
          if (formData.measurements && validateMeasurementValues(formData.measurements).issues.length > 0) {
            return false;
          }
          return Boolean(
            formData.measurementProfileId ??
              (formData.measurements && Object.keys(formData.measurements).length > 0),
          );
        default:
          return true;
      }
    },
    [formData],
  );

  const goToNextStep = useCallback(() => {
    if (currentStep < 7 && isStepValid(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, isStepValid]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= 7) {
        setCurrentStep(step);
      }
    },
    [],
  );

  return {
    currentStep,
    formData,
    projectRef: project?.projectRef ?? `ANG-PAT-${projectId.slice(0, 5).toUpperCase()}`,
    isProjectLoading,
    updateField,
    updateDetail,
    applyInspiration,
    isStepValid,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
};
