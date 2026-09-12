import { PatternExportFormat } from '@angaly/types';

export interface ExportFormatOption {
  format: PatternExportFormat;
  label: string;
  description: string;
  sheetSize: string;
  badge?: string;
}

export const EXPORT_FORMAT_OPTIONS: ExportFormatOption[] = [
  {
    format: PatternExportFormat.PDF_A4,
    label: 'PDF Planches A4',
    description: 'À imprimer sur imprimante domestique standard avec repères d’assemblage scotchables',
    sheetSize: '210 × 297 mm',
  },
  {
    format: PatternExportFormat.PDF_A3,
    label: 'PDF Planches A3',
    description: 'Idéal pour les imprimantes semi-professionnelles et les ateliers équipés',
    sheetSize: '297 × 420 mm',
  },
  {
    format: PatternExportFormat.PDF_A0,
    label: 'PDF Traceur A0',
    description: 'Impression en continu sans assemblage pour boutiques et tireurs de plans',
    sheetSize: '841 × 1189 mm',
  },
  {
    format: PatternExportFormat.SVG,
    label: 'SVG Vectoriel',
    description: 'Format vectoriel ouvert, compatible logiciels de DAO, découpe laser et traceurs numériques',
    sheetSize: 'Vectoriel illimité',
  },
  {
    format: PatternExportFormat.DXF,
    label: 'DXF Standard',
    description: 'Format standard de l’industrie textile pour tables de découpe automatisées (Lectra, Gerber)',
    sheetSize: 'Usage professionnel',
    badge: 'Atelier / Pro',
  },
];
