'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMeasurementProfiles } from '../hooks/useMeasurementProfiles';
import { useMeasurementProfileForm } from '../hooks/useMeasurementProfileForm';
import { useDuplicateMeasurementProfile } from '../hooks/useDuplicateMeasurementProfile';
import { useDeleteMeasurementProfile } from '../hooks/useDeleteMeasurementProfile';
import { MeasurementProfileCard } from './MeasurementProfileCard';
import { MeasurementProfileFormDrawer } from './MeasurementProfileFormDrawer';
import { DeleteProfileConfirmDialog } from './DeleteProfileConfirmDialog';
import { EmptyMeasurementProfilesState } from './EmptyMeasurementProfilesState';
import type { MeasurementProfileDto } from '../api/measurement-profiles.api';
import type { MeasurementProfileFormValues } from '../schemas/measurement-profile.schema';

export const MesMesuresPage = () => {
  const { data: profiles, isLoading } = useMeasurementProfiles();
  const { createProfile, updateProfile, isCreating, isUpdating } = useMeasurementProfileForm();
  const { mutate: duplicate, isPending: isDuplicating } = useDuplicateMeasurementProfile();
  const { mutate: deleteProfile, isPending: isDeleting } = useDeleteMeasurementProfile();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MeasurementProfileDto | null>(null);
  
  const [profileToDelete, setProfileToDelete] = useState<MeasurementProfileDto | null>(null);

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (profile: MeasurementProfileDto) => {
    setEditingProfile(profile);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProfile(null);
  };

  const handleSubmitForm = async (data: MeasurementProfileFormValues) => {
    try {
      // Nettoyer les valeurs vides
      const cleanedValues: Record<string, number> = {};
      Object.entries(data.values).forEach(([k, v]) => {
        if (v !== undefined && v !== null && !isNaN(v)) {
          cleanedValues[k] = v;
        }
      });

      const payload = {
        label: data.label,
        unit: data.unit,
        values: cleanedValues,
      };

      if (editingProfile) {
        await updateProfile({ id: editingProfile.id, payload });
      } else {
        await createProfile(payload);
      }
      handleCloseDrawer();
    } catch {
      // Ignoré, pris en charge par le mutation hook
    }
  };

  const handleUseProject = (id: string) => {
    // Redirection vers le wizard avec ce profil pre-rempli
    window.location.href = `/pattern-studio/wizard?profile=${id}`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl text-angaly-primary mb-2">Mes mesures</h1>
          <p className="text-sm italic text-angaly-slate">
            Vos mesures sont des données personnelles protégées et ne sont utilisées que pour vos projets Angaly.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-angaly-primary hover:bg-angaly-primary-dark text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Ajouter un profil
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-angaly-ivory/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : profiles?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <MeasurementProfileCard
              key={profile.id}
              profile={profile}
              onEdit={handleOpenEdit}
              onDuplicate={(id) => duplicate(id)}
              onDelete={setProfileToDelete}
              onUse={handleUseProject}
              isDuplicating={isDuplicating}
            />
          ))}
        </div>
      ) : (
        <EmptyMeasurementProfilesState onAdd={handleOpenCreate} />
      )}

      <MeasurementProfileFormDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        profile={editingProfile}
        onSubmit={(data) => { void handleSubmitForm(data); }}
        isLoading={isCreating || isUpdating}
      />

      <DeleteProfileConfirmDialog
        isOpen={!!profileToDelete}
        profileName={profileToDelete?.label ?? ''}
        isDeleting={isDeleting}
        onCancel={() => setProfileToDelete(null)}
        onConfirm={() => {
          if (profileToDelete) {
            deleteProfile(profileToDelete.id, {
              onSuccess: () => setProfileToDelete(null),
            });
          }
        }}
      />
    </div>
  );
};
