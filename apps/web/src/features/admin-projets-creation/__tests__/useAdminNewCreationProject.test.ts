import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreationProjectStage, Role } from '@angaly/types';
import { useAdminNewCreationProject } from '../hooks/useAdminNewCreationProject';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/api-client');

const CUSTOMERS = [
  { id: 'c-1', firstName: 'Hanitra', lastName: 'Rakoto', email: 'hanitra@angaly.mg', phone: '+261340012345' },
];
const QUOTES = [
  { id: 'q-1', quoteNumber: 'DEV-2026-0042', total: '1500000', customerName: 'Hanitra Rakoto' },
];
const STAFF = [{ id: 'u-2', email: 'couturiere@angaly.mg', role: Role.COUTURIERE }];

const CREATED_PROJECT = {
  id: 'p-new',
  reference: 'CRP-2026-NEW001',
  title: 'Robe de mariée — Mme Rakoto',
  description: 'Notes',
  stage: CreationProjectStage.CONSULTATION,
  quoteId: 'q-1',
  quoteNumber: 'DEV-2026-0042',
  creationId: null,
  completedAt: null,
  createdAt: '2026-10-02T10:00:00.000Z',
  updatedAt: '2026-10-02T10:00:00.000Z',
};

describe('useAdminNewCreationProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/customers')) return Promise.resolve(CUSTOMERS);
      if (url.includes('/quotes')) return Promise.resolve(QUOTES);
      if (url.includes('/assignees')) return Promise.resolve(STAFF);
      return Promise.resolve([]);
    });
    vi.mocked(apiClient.post).mockResolvedValue(CREATED_PROJECT);
  });

  it('initializes default values and fetches lookup lists', async () => {
    const { result } = renderHook(() => useAdminNewCreationProject(), { wrapper: withQueryClient() });

    expect(result.current.title).toBe('Robe de mariée — Mme Rakoto');
    expect(result.current.garmentType).toBe('Robe de mariée');
    expect(result.current.occasion).toBe('Mariage');
    expect(result.current.eventDate).toBe('2026-12-14');
    expect(result.current.budgetRange).toBe('1 000 000–2 000 000 Ar');
    expect(result.current.initialStage).toBe(CreationProjectStage.CONSULTATION);

    await waitFor(() => expect(result.current.customers).toEqual(CUSTOMERS));
    await waitFor(() => expect(result.current.quotes).toEqual(QUOTES));
    await waitFor(() => expect(result.current.assignees).toEqual(STAFF));
  });

  it('fails validation when title is empty', async () => {
    const { result } = renderHook(() => useAdminNewCreationProject(), { wrapper: withQueryClient() });

    act(() => {
      result.current.setTitle('');
      result.current.setSelectedCustomerId('c-1');
    });
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.errors.title).toBe('Le titre du projet est requis');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('fails validation when customer is missing', async () => {
    const { result } = renderHook(() => useAdminNewCreationProject(), { wrapper: withQueryClient() });

    act(() => {
      result.current.setSelectedCustomerId('');
    });
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.errors.customer).toBe('Veuillez sélectionner ou créer une cliente');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('validates required fields when creating new customer inline', async () => {
    const { result } = renderHook(() => useAdminNewCreationProject(), { wrapper: withQueryClient() });

    act(() => {
      result.current.setIsCreatingNewCustomer(true);
      result.current.setNewCustomer({ firstName: '', lastName: '', email: '', phone: '' });
    });
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.errors.customer).toBe('Prénom, nom et email sont requis pour la nouvelle cliente');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('successfully creates project with existing customer and navigates', async () => {
    const { result } = renderHook(() => useAdminNewCreationProject(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.customers).toEqual(CUSTOMERS));

    act(() => {
      result.current.setSelectedCustomerId('c-1');
      result.current.setSelectedQuoteId('q-1');
      result.current.setAssignedToId('u-2');
    });
    act(() => {
      result.current.handleSubmit(false);
    });

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/admin/creation-projects',
        expect.objectContaining({
          title: 'Robe de mariée — Mme Rakoto',
          customerId: 'c-1',
          quoteId: 'q-1',
          assignedToId: 'u-2',
        }),
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projets-creation/p-new');
    });
  });

  it('successfully creates project with new customer inline and as draft', async () => {
    const { result } = renderHook(() => useAdminNewCreationProject(), { wrapper: withQueryClient() });

    act(() => {
      result.current.setIsCreatingNewCustomer(true);
      result.current.setNewCustomer({
        firstName: 'Soa',
        lastName: 'Ravelo',
        email: 'soa.ravelo@angaly.mg',
        phone: '+261320011122',
      });
    });
    act(() => {
      result.current.handleSubmit(true);
    });

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/admin/creation-projects',
        expect.objectContaining({
          title: 'Robe de mariée — Mme Rakoto',
          newCustomer: {
            firstName: 'Soa',
            lastName: 'Ravelo',
            email: 'soa.ravelo@angaly.mg',
            phone: '+261320011122',
          },
          initialStage: CreationProjectStage.CONSULTATION,
        }),
      );
    });
  });

  it('manages inspiration photos addition and removal', () => {
    const { result } = renderHook(() => useAdminNewCreationProject(), { wrapper: withQueryClient() });

    const dummyFile = new File(['content'], 'robe.jpg', { type: 'image/jpeg' });
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test/robe.jpg');

    act(() => {
      result.current.addInspirationPhotos([dummyFile]);
    });

    expect(result.current.inspirationPhotos).toHaveLength(1);
    expect(result.current.inspirationPhotos[0]!.name).toBe('robe.jpg');

    act(() => {
      result.current.removeInspirationPhoto(result.current.inspirationPhotos[0]!.id);
    });

    expect(result.current.inspirationPhotos).toHaveLength(0);
  });
});
