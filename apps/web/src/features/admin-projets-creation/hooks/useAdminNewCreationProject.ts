'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CREATION_PROJECT_STAGES_ORDER,
  CreationProjectStage,
  type AdminCustomerOptionDto,
  type AdminQuoteOptionDto,
  type CreationProjectAssigneeDto,
} from '@angaly/types';
import { ROUTES } from '@/lib/routes';
import { adminCreationProjectsApi } from '../api/admin-creation-projects.api';
import { ADMIN_CREATION_PROJECTS_QUERY_KEYS } from '../consts/queryKeys';

export interface InspirationPhotoItem {
  id: string;
  name: string;
  url: string;
}

export const GARMENT_TYPE_OPTIONS = [
  'Robe de mariée',
  'Costume',
  'Robe de soirée',
  'Tenue traditionnelle',
  'Autre',
] as const;

export const OCCASION_OPTIONS = [
  'Mariage',
  'Soirée',
  'Cérémonie',
  'Professionnel',
  'Quotidien',
  'Autre',
] as const;

export const BUDGET_RANGE_OPTIONS = [
  '< 500 000 Ar',
  '500 000–1 000 000 Ar',
  '1 000 000–2 000 000 Ar',
  'Sur devis',
] as const;

export function useAdminNewCreationProject() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Cliente state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Création state
  const [title, setTitle] = useState('Robe de mariée — Mme Rakoto');
  const [garmentType, setGarmentType] = useState<string>('Robe de mariée');
  const [occasion, setOccasion] = useState<string>('Mariage');
  const [eventDate, setEventDate] = useState<string>('2026-12-14');
  const [description, setDescription] = useState('');

  // Budget & devis state
  const [budgetRange, setBudgetRange] = useState<string>('1 000 000–2 000 000 Ar');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');

  // Atelier state
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [initialStage, setInitialStage] = useState<CreationProjectStage>(CreationProjectStage.CONSULTATION);
  const [inspirationPhotos, setInspirationPhotos] = useState<InspirationPhotoItem[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<{ title?: string; customer?: string }>({});

  // Queries
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<AdminCustomerOptionDto[]>({
    queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.customers(customerSearchQuery),
    queryFn: () => adminCreationProjectsApi.listCustomers(customerSearchQuery),
  });

  const { data: quotes = [] } = useQuery<AdminQuoteOptionDto[]>({
    queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.quotes,
    queryFn: () => adminCreationProjectsApi.listQuotes(),
  });

  const { data: assignees = [], isLoading: isLoadingAssignees } = useQuery<CreationProjectAssigneeDto[]>({
    queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.assignees,
    queryFn: () => adminCreationProjectsApi.listAssignees(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: adminCreationProjectsApi.create,
    onSuccess: (newProject) => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_CREATION_PROJECTS_QUERY_KEYS.all });
      router.push(ROUTES.adminCreationProject(newProject.id));
    },
  });

  // Helper to remove inspiration photo
  const removeInspirationPhoto = (id: string) => {
    setInspirationPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Helper to add inspiration photo (mock/local or uploaded)
  const addInspirationPhotos = (files: FileList | File[]) => {
    const newItems: InspirationPhotoItem[] = [];
    const remainingSlots = 5 - inspirationPhotos.length;
    const toAdd = Array.from(files).slice(0, remainingSlots);

    for (const file of toAdd) {
      const url = URL.createObjectURL(file);
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        url,
      });
    }

    if (newItems.length > 0) {
      setInspirationPhotos((prev) => [...prev, ...newItems]);
    }
  };

  // Validation check
  const validate = (): boolean => {
    const nextErrors: { title?: string; customer?: string } = {};

    if (!title.trim()) {
      nextErrors.title = 'Le titre du projet est requis';
    }

    if (!isCreatingNewCustomer) {
      if (!selectedCustomerId) {
        nextErrors.customer = 'Veuillez sélectionner ou créer une cliente';
      }
    } else {
      if (!newCustomer.firstName.trim() || !newCustomer.lastName.trim() || !newCustomer.email.trim()) {
        nextErrors.customer = 'Prénom, nom et email sont requis pour la nouvelle cliente';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Submission handler
  const handleSubmit = (asDraft: boolean = false) => {
    if (!validate()) return;

    createMutation.mutate({
      title: title.trim(),
      customerId: !isCreatingNewCustomer ? selectedCustomerId : undefined,
      newCustomer: isCreatingNewCustomer
        ? {
            firstName: newCustomer.firstName.trim(),
            lastName: newCustomer.lastName.trim(),
            email: newCustomer.email.trim(),
            phone: newCustomer.phone.trim() || null,
          }
        : undefined,
      garmentType,
      occasion,
      eventDate,
      budgetRange,
      description: asDraft ? `[Brouillon] ${description}`.trim() : description,
      initialStage: asDraft ? CreationProjectStage.CONSULTATION : initialStage,
      quoteId: selectedQuoteId || undefined,
      assignedToId: assignedToId || null,
      inspirationMediaUrls: inspirationPhotos.map((p) => p.name),
    });
  };

  // Live Summary computed values
  const summaryClientName = useMemo(() => {
    if (isCreatingNewCustomer) {
      const full = `${newCustomer.firstName} ${newCustomer.lastName}`.trim();
      return full || 'Nouvelle cliente';
    }
    const found = customers.find((c) => c.id === selectedCustomerId);
    return found ? `${found.firstName} ${found.lastName}` : '—';
  }, [isCreatingNewCustomer, newCustomer, customers, selectedCustomerId]);

  const summaryGarment = garmentType || '—';

  const summaryEvent = useMemo(() => {
    if (!occasion && !eventDate) return '—';
    if (occasion && eventDate) return `${occasion} · ${eventDate}`;
    return occasion || eventDate || '—';
  }, [occasion, eventDate]);

  const summaryBudget = budgetRange || '—';

  const summaryAssigneeName = useMemo(() => {
    if (!assignedToId) return 'Non assignée';
    const found = assignees.find((a) => a.id === assignedToId);
    return found ? found.email : 'Non assignée';
  }, [assignedToId, assignees]);

  const currentStageIndex = useMemo(() => {
    return CREATION_PROJECT_STAGES_ORDER.indexOf(initialStage);
  }, [initialStage]);

  return {
    // Form fields
    customerSearchQuery,
    setCustomerSearchQuery,
    selectedCustomerId,
    setSelectedCustomerId,
    isCreatingNewCustomer,
    setIsCreatingNewCustomer,
    newCustomer,
    setNewCustomer,
    title,
    setTitle,
    garmentType,
    setGarmentType,
    occasion,
    setOccasion,
    eventDate,
    setEventDate,
    description,
    setDescription,
    budgetRange,
    setBudgetRange,
    selectedQuoteId,
    setSelectedQuoteId,
    assignedToId,
    setAssignedToId,
    initialStage,
    setInitialStage,
    inspirationPhotos,
    removeInspirationPhoto,
    addInspirationPhotos,

    // Data lists & loading
    customers,
    isLoadingCustomers,
    quotes,
    assignees,
    isLoadingAssignees,

    // Validation & mutation
    errors,
    isSubmitting: createMutation.isPending,
    submitError: createMutation.error,
    handleSubmit,

    // Live summary helpers
    summaryClientName,
    summaryGarment,
    summaryEvent,
    summaryBudget,
    summaryAssigneeName,
    currentStageIndex,
  };
}
