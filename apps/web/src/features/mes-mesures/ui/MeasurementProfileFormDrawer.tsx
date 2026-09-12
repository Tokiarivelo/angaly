import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { MeasurementUnit } from '@angaly/types';
import { Button } from '@/components/ui/button';
import { measurementProfileSchema } from '../schemas/measurement-profile.schema';
import type { MeasurementProfileFormValues } from '../schemas/measurement-profile.schema';
import { MEASUREMENT_FIELDS } from '../consts/measurement-fields.const';
import { MeasurementFieldRow } from './MeasurementFieldRow';
import type { MeasurementProfileDto } from '../api/measurement-profiles.api';

interface MeasurementProfileFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: MeasurementProfileDto | null;
  onSubmit: (data: MeasurementProfileFormValues) => void;
  isLoading: boolean;
}

export const MeasurementProfileFormDrawer = ({
  isOpen,
  onClose,
  profile,
  onSubmit,
  isLoading,
}: MeasurementProfileFormDrawerProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeasurementProfileFormValues>({
    resolver: zodResolver(measurementProfileSchema),
    defaultValues: {
      label: '',
      unit: MeasurementUnit.CM,
      values: {},
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (profile) {
        reset({
          label: profile.label,
          unit: profile.unit,
          values: profile.values || {},
        });
      } else {
        reset({
          label: '',
          unit: MeasurementUnit.CM,
          values: {},
        });
      }
    }
  }, [isOpen, profile, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-angaly-primary/20 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-angaly-ivory shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border bg-white">
          <h2 className="font-serif text-xl text-angaly-primary">
            {profile ? 'Modifier le profil' : 'Nouveau profil'}
          </h2>
          <button onClick={onClose} className="p-2 text-angaly-slate hover:text-angaly-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-angaly-primary">
                Nom du profil
              </label>
              <input
                type="text"
                {...register('label')}
                className="w-full p-2 border border-border rounded focus:outline-none focus:border-angaly-primary"
                placeholder="Ex: Mesures Costume 2026"
              />
              {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label.message}</p>}
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-lg text-angaly-primary">Mensurations</h3>
              <p className="text-xs italic text-angaly-slate mb-4">
                En centimètres (cm). Vos mesures sont des données personnelles protégées.
              </p>

              <div className="bg-white rounded border border-border p-4">
                {MEASUREMENT_FIELDS.map((field) => (
                  <MeasurementFieldRow
                    key={field.key}
                    fieldKey={field.key}
                    label={field.label}
                    help={field.help}
                    register={register}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border bg-white">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-angaly-primary hover:bg-angaly-primary-dark text-white"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer ce profil'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
