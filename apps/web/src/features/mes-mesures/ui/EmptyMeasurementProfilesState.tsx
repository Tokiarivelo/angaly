import React from 'react';
import { Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EmptyMeasurementProfilesState = ({ onAdd }: { onAdd: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-border border-dashed rounded-lg bg-angaly-ivory/50">
      <div className="p-4 mb-4 rounded-full bg-angaly-navy-soft/10">
        <Ruler className="w-8 h-8 text-angaly-navy" />
      </div>
      <h3 className="mb-2 font-serif text-xl text-angaly-primary">
        Vous n'avez pas encore de profil de mesures
      </h3>
      <p className="mb-6 text-sm text-angaly-slate">
        Ajoutez vos mensurations pour les utiliser dans vos futurs projets de patron.
      </p>
      <Button onClick={onAdd} className="bg-angaly-primary hover:bg-angaly-primary-dark text-white">
        Ajouter mon premier profil
      </Button>
    </div>
  );
};
