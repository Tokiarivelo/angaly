'use client';

import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { usePatternProjects } from '../hooks/usePatternProjects';
import { useOpenPatternProject } from '../hooks/useOpenPatternProject';
import { useCreateProject } from '../hooks/useCreateProject';
import { PatternProjectCard } from './PatternProjectCard';
import { EmptyPatternProjectsState } from './EmptyPatternProjectsState';

export const MesProjetsPatronPage = () => {
  const { data: projects = [], isLoading } = usePatternProjects();
  const { openProject } = useOpenPatternProject();
  const { mutate: createProject, isPending: isCreating } = useCreateProject();

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl text-angaly-primary mb-2">
            Mes projets de patron
          </h1>
          <p className="text-sm italic text-angaly-slate">
            Vos patrons numériques paramétriques et leurs versions d’atelier vérifiées.
          </p>
        </div>

        <button
          type="button"
          onClick={() => createProject('ROBE')}
          disabled={isCreating}
          className="inline-flex items-center gap-2 px-6 py-3 rounded bg-angaly-gold text-white hover:bg-angaly-gold-dark text-xs uppercase tracking-wider font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Création…</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Nouveau projet</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content: Loading | Empty | Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 bg-angaly-ivory/60 rounded-xl animate-pulse border border-angaly-border"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyPatternProjectsState
          onCreateProject={() => createProject('ROBE')}
          isCreating={isCreating}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <PatternProjectCard
              key={project.id}
              project={project}
              onOpenProject={openProject}
            />
          ))}
        </div>
      )}

      {/* Privacy note */}
      <p className="text-xs italic text-angaly-slate/70 mt-12 text-center">
        Vos mesures sont des données personnelles protégées et ne sont utilisées que pour vos projets Angaly.
      </p>
    </div>
  );
};
