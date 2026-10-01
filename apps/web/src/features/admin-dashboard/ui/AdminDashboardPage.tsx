import React from 'react';
import Link from 'next/link';
import { Sparkles, Scissors, FileEdit, Image as ImageIcon, ArrowRight, UserCheck } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

const sections = [
  {
    label: 'Projets de création',
    description:
      'Suivre l\'avancement des projets sur-mesure, assigner les couturières et valider les étapes de fabrication.',
    href: ROUTES.adminCreationProjects,
    icon: Scissors,
  },
  {
    label: 'Gestion de contenu',
    description:
      'Modifier les textes éditoriaux, descriptions de collections et sections du site public sans redéploiement.',
    href: '/gestion-contenu',
    icon: FileEdit,
  },
  {
    label: 'Médiathèque',
    description:
      'Gérer les photographies haute résolution, visuels d\'ateliers et médias stockés sur MinIO.',
    href: '/mediatheque',
    icon: ImageIcon,
  },
  {
    label: 'Paramètres IA',
    description:
      'Choisir le modèle utilisé par Pattern Studio pour estimer les mesures manquantes (Gemini ou modèle entraîné).',
    href: '/ai-settings',
    icon: Sparkles,
  },
];

export const AdminDashboardPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl text-angaly-navy font-normal mb-2">
          Administration ANGALY
        </h1>
        <p className="text-angaly-slate text-sm font-sans">
          Portail de gestion interne — Maison de Haute Couture ANGALY.
        </p>
      </div>

      {/* Client Space Switcher Banner */}
      <div className="bg-white border border-angaly-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-angaly-warm-ivory/40 text-angaly-navy flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <h2 className="font-heading text-base text-angaly-navy font-medium">Espace Client (Vue Client)</h2>
            <p className="text-xs text-angaly-slate">
              Consulter le tableau de bord client tel qu'il apparaît pour les membres privilégiés.
            </p>
          </div>
        </div>
        <Link
          href={ROUTES.compte}
          className="bg-angaly-navy hover:bg-angaly-navy-blue text-white px-5 py-2.5 font-sans text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 self-start sm:self-auto shrink-0 font-medium"
        >
          <span>Accéder à l'Espace Client</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Back-office Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white p-6 border border-angaly-border hover:border-angaly-navy transition-colors flex flex-col justify-between group h-full min-h-[160px]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-9 h-9 rounded bg-angaly-warm-ivory/30 text-angaly-navy flex items-center justify-center group-hover:bg-angaly-navy group-hover:text-angaly-champagne transition-colors">
                    <Icon size={18} />
                  </span>
                  <ArrowRight size={15} className="text-angaly-slate group-hover:text-angaly-navy transition-colors" />
                </div>
                <h3 className="text-angaly-navy font-heading text-base font-medium mb-1.5">{section.label}</h3>
                <p className="text-angaly-slate text-xs leading-relaxed font-sans">{section.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
