import React from 'react';
import { Copy, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MeasurementProfileDto } from '../api/measurement-profiles.api';

interface MeasurementProfileCardProps {
  profile: MeasurementProfileDto;
  onEdit: (profile: MeasurementProfileDto) => void;
  onDuplicate: (id: string) => void;
  onDelete: (profile: MeasurementProfileDto) => void;
  onUse: (id: string) => void;
  isDuplicating: boolean;
}

export const MeasurementProfileCard = ({
  profile,
  onEdit,
  onDuplicate,
  onDelete,
  onUse,
  isDuplicating,
}: MeasurementProfileCardProps) => {
  // Extract 2-3 key measurements for preview
  const previewKeys = ['TOUR_POITRINE', 'TOUR_TAILLE', 'TOUR_BASSIN'];
  const previews = previewKeys
    .filter((k) => profile.values?.[k])
    .map((k) => ({
      label: k.replace('TOUR_', '').toLowerCase(),
      value: profile.values[k],
    }));

  return (
    <div className="flex flex-col p-6 bg-white border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-serif text-lg text-angaly-primary font-medium">{profile.label}</h3>
          <p className="text-xs text-angaly-slate mt-1">
            Créé le {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(profile.createdAt))}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(profile)}
            className="p-2 text-angaly-slate hover:text-angaly-primary hover:bg-angaly-ivory rounded"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDuplicate(profile.id)}
            disabled={isDuplicating}
            className="p-2 text-angaly-slate hover:text-angaly-primary hover:bg-angaly-ivory rounded disabled:opacity-50"
            title="Dupliquer"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(profile)}
            className="p-2 text-angaly-slate hover:text-red-600 hover:bg-red-50 rounded"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 mb-6">
        {previews.length > 0 ? (
          <ul className="text-sm text-angaly-slate space-y-1">
            {previews.map((p, i) => (
              <li key={i} className="flex justify-between">
                <span className="capitalize">{p.label} :</span>
                <span className="font-medium">{p.value} {profile.unit.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-angaly-slate italic">Aucune mensuration saisie.</p>
        )}
      </div>

      <Button
        onClick={() => onUse(profile.id)}
        className="w-full bg-angaly-ivory text-angaly-primary border border-angaly-border hover:bg-angaly-gold hover:text-white transition-colors flex items-center justify-center gap-2"
      >
        Utiliser pour un projet <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};
