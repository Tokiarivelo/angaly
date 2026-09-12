export const PATTERN_STATUSES = [
  'DRAFT',
  'GENERATING',
  'GENERATED',
  'REVIEW_REQUIRED',
  'CORRECTION_REQUIRED',
  'VALIDATED',
  'EXPORTED',
  'ARCHIVED',
] as const;

export type PatternStatus = (typeof PATTERN_STATUSES)[number];

export const PATTERN_EXPORT_FORMATS = [
  'PDF_A4',
  'PDF_A3',
  'PDF_A0',
  'SVG',
  'DXF',
] as const;

export type PatternExportFormat = (typeof PATTERN_EXPORT_FORMATS)[number];
