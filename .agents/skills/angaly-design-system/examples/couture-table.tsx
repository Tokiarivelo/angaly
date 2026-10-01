import React from 'react';
import { Eye, Download, MoreHorizontal } from 'lucide-react';

interface ProjectRow {
  id: string;
  reference: string;
  client: string;
  type: string;
  status: 'confection' | 'essayage' | 'livre' | 'brouillon';
  date: string;
}

const mockProjects: ProjectRow[] = [
  {
    id: '1',
    reference: 'ANG-2026-089',
    client: 'Ranavalona H.',
    type: 'Robe de mariée soie sauvage',
    status: 'confection',
    date: '12 Octobre 2026',
  },
  {
    id: '2',
    reference: 'ANG-2026-092',
    client: 'Andry R.',
    type: 'Costume sur mesure 3 pièces',
    status: 'essayage',
    date: '15 Octobre 2026',
  },
  {
    id: '3',
    reference: 'ANG-2026-085',
    client: 'Miora T.',
    type: 'Patron Studio Premium #44',
    status: 'livre',
    date: '28 Septembre 2026',
  },
];

const renderStatusBadge = (status: ProjectRow['status']) => {
  switch (status) {
    case 'confection':
      return (
        <span className="inline-flex items-center rounded-sm border border-angaly-champagne/40 bg-angaly-champagne/15 px-2 py-0.5 text-[11px] font-medium text-angaly-navy">
          En confection
        </span>
      );
    case 'essayage':
      return (
        <span className="inline-flex items-center rounded-sm border border-angaly-soft-navy/30 bg-angaly-soft-navy/10 px-2 py-0.5 text-[11px] font-medium text-angaly-soft-navy">
          Essayage prévu
        </span>
      );
    case 'livre':
      return (
        <span className="inline-flex items-center rounded-sm border border-angaly-success/20 bg-angaly-success/10 px-2 py-0.5 text-[11px] font-medium text-angaly-success">
          Livré & validé
        </span>
      );
    case 'brouillon':
    default:
      return (
        <span className="inline-flex items-center rounded-sm border border-angaly-slate/20 bg-angaly-slate/10 px-2 py-0.5 text-[11px] font-medium text-angaly-slate">
          Brouillon
        </span>
      );
  }
};

/**
 * Exemple de référence pour les tableaux de données dans le back-office et dashboard client ANGALY.
 * Conception sobre, sans fioritures SaaS, bordures #D9D4CA et survol ivoire délicat.
 */
export const CoutureTableExample: React.FC = () => {
  return (
    <div className="overflow-hidden rounded-sm border border-angaly-border bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* En-tête de tableau */}
          <thead className="border-b border-angaly-border bg-angaly-ivory/50 text-[10px] font-medium uppercase tracking-wider text-angaly-slate">
            <tr>
              <th scope="col" className="px-4 py-3">
                Référence
              </th>
              <th scope="col" className="px-4 py-3">
                Cliente / Client
              </th>
              <th scope="col" className="px-4 py-3">
                Création
              </th>
              <th scope="col" className="px-4 py-3">
                Statut Atelier
              </th>
              <th scope="col" className="px-4 py-3">
                Date
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          {/* Lignes du tableau */}
          <tbody className="divide-y divide-angaly-border/60">
            {mockProjects.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-angaly-ivory/40"
              >
                <td className="whitespace-nowrap px-4 py-3.5 font-medium text-angaly-navy">
                  {row.reference}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-angaly-slate">
                  {row.client}
                </td>
                <td className="px-4 py-3.5 font-medium text-angaly-navy">
                  {row.type}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  {renderStatusBadge(row.status)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-angaly-slate">
                  {row.date}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Voir les détails du projet ${row.reference}`}
                      className="rounded-sm p-1.5 text-angaly-slate hover:bg-angaly-warm-ivory/60 hover:text-angaly-navy"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Télécharger la fiche de mesure ${row.reference}`}
                      className="rounded-sm p-1.5 text-angaly-slate hover:bg-angaly-warm-ivory/60 hover:text-angaly-navy"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Options complémentaires"
                      className="rounded-sm p-1.5 text-angaly-slate hover:bg-angaly-warm-ivory/60 hover:text-angaly-navy"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
