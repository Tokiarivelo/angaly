'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchPatternProject, updatePatternProject } from '../api/pattern-projects.api';
import type { WizardFormData } from '../types/wizard-state.types';

export const PATTERN_PROJECT_DETAIL_KEY = (id: string) => ['pattern-project', id];

export const usePatternWizard = (projectId: string) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
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
        measurementProfileId: updated.measurementProfileId,
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

  const isStepValid = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return Boolean(formData.garmentType);
        case 2:
          return Boolean(formData.occasion);
        case 3:
          return Boolean(formData.style);
        case 4:
          return Boolean(formData.cutType);
        case 5:
          return true; // Détails are optional/preset
        case 6:
          return true; // Inspiration photo is optional
        case 7:
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
    isStepValid,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
};
