import { CreationProjectStage, CREATION_PROJECT_STAGES_ORDER } from '@angaly/types';

export const ADMIN_CREATION_STAGE_LABELS: Record<CreationProjectStage, string> = {
  [CreationProjectStage.CONSULTATION]: 'Consultation',
  [CreationProjectStage.CONCEPTION]: 'Conception',
  [CreationProjectStage.PATRON]: 'Patron',
  [CreationProjectStage.CONFECTION]: 'Confection',
  [CreationProjectStage.ESSAYAGE]: 'Essayage',
  [CreationProjectStage.TERMINEE]: 'Terminée',
};

export const ADMIN_CREATION_STAGE_BADGE_CLASSES: Record<CreationProjectStage, string> = {
  [CreationProjectStage.CONSULTATION]: 'bg-[#3E6D91]/10 text-[#3E6D91] border-[#3E6D91]/20',
  [CreationProjectStage.CONCEPTION]: 'bg-[#936C3E]/10 text-[#936C3E] border-[#936C3E]/20',
  [CreationProjectStage.PATRON]: 'bg-[#5C697A]/10 text-[#5C697A] border-[#5C697A]/20',
  [CreationProjectStage.CONFECTION]: 'bg-[#18375D]/10 text-[#18375D] border-[#18375D]/20',
  [CreationProjectStage.ESSAYAGE]: 'bg-[#A47735]/10 text-[#A47735] border-[#A47735]/20',
  [CreationProjectStage.TERMINEE]: 'bg-[#46745A]/10 text-[#46745A] border-[#46745A]/20',
};

export const FILTER_CHIP_STAGES = ['ALL', ...CREATION_PROJECT_STAGES_ORDER] as const;
export type FilterChipStage = (typeof FILTER_CHIP_STAGES)[number];
