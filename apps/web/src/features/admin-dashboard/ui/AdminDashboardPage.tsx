import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

const sections = [
  {
    label: 'Paramètres IA',
    description:
      "Choisir le modèle utilisé par Pattern Studio pour estimer les mesures manquantes (Gemini ou le modèle statistique entraîné).",
    href: '/ai-settings',
    icon: Sparkles,
  },
];

export const AdminDashboardPage: React.FC = () => {
  return (
    <div>
      <h1 className="font-serif text-2xl sm:text-3xl text-primary-deep-navy font-light mb-2">
        Administration ANGALY
      </h1>
      <p className="text-slate text-sm mb-8">Espace réservé aux administrateurs.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white p-5 rounded-xl border border-border hover:border-primary-deep-navy transition-colors flex flex-col gap-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon size={20} />
                </span>
                <ArrowRight size={16} className="text-slate group-hover:text-primary-deep-navy transition-colors" />
              </div>
              <h2 className="text-primary-deep-navy font-medium text-sm">{section.label}</h2>
              <p className="text-slate text-xs leading-relaxed">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
