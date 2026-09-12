import { PatternStatus } from '@angaly/types';

export interface StatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const PATTERN_STATUS_CONFIG: Record<PatternStatus, StatusMeta> = {
  [PatternStatus.DRAFT]: {
    label: 'Brouillon',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  },
  [PatternStatus.GENERATING]: {
    label: 'Génération en cours',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  [PatternStatus.GENERATED]: {
    label: 'Généré',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  [PatternStatus.REVIEW_REQUIRED]: {
    label: 'À vérifier',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  [PatternStatus.CORRECTION_REQUIRED]: {
    label: 'Correction demandée',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  [PatternStatus.VALIDATED]: {
    label: 'Validé',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  [PatternStatus.EXPORTED]: {
    label: 'Exporté',
    badgeClass: 'bg-[#061938]/10 text-[#061938] border-[#C5B190]',
    dotClass: 'bg-[#936C3E]',
  },
  [PatternStatus.ARCHIVED]: {
    label: 'Archivé',
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
    dotClass: 'bg-gray-400',
  },
};
