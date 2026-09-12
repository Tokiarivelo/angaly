import React from 'react';
import { Compass, Plus, Loader2 } from 'lucide-react';

interface EmptyPatternProjectsStateProps {
  onCreateProject: () => void;
  isCreating: boolean;
}

export const EmptyPatternProjectsState: React.FC<EmptyPatternProjectsStateProps> = ({
  onCreateProject,
  isCreating,
}) => {
  return (
    <div className="bg-white border border-angaly-border rounded-2xl p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
      <div className="w-16 h-16 rounded-full bg-angaly-ivory flex items-center justify-center mx-auto mb-6 text-angaly-gold">
        <Compass className="w-8 h-8" />
      </div>

      <h2 className="font-serif text-2xl text-angaly-primary mb-3">
        Vous n’avez pas encore de projet de patron
      </h2>
      <p className="text-sm text-angaly-slate font-light leading-relaxed mb-8">
        Concevez votre premier patron sur-mesure grâce à notre atelier numérique et faites-le
        vérifier par les mains expertes de nos couturières.
      </p>

      <button
        type="button"
        onClick={onCreateProject}
        disabled={isCreating}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded bg-angaly-gold text-white hover:bg-angaly-gold-dark text-xs uppercase tracking-wider font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
      >
        {isCreating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Création en cours…</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span>Créer mon premier patron</span>
          </>
        )}
      </button>
    </div>
  );
};
