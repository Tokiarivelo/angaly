import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreationProjectStage,
  type GenerateCreationProjectAiPatternResponseDto,
  type GeneratedPatternPieceGeometryDto,
} from '@angaly/types';
import { GeneratePatternPiecesUseCase } from '../../../pattern-engine/application/use-cases/generate-pattern-pieces.use-case';
import { SuggestPatternParametersUseCase } from '../../../ai-inference/application/use-cases/suggest-pattern-parameters.use-case';
import {
  CREATION_PROJECT_REPOSITORY,
  type ICreationProjectRepository,
} from '../../domain/repositories/creation-project.repository';
import { GenerateCreationProjectAiPatternDto } from '../dtos/generate-creation-project-ai-pattern.dto';

const DEFAULT_MEASUREMENTS: Record<string, number> = {
  TOUR_POITRINE: 88,
  TOUR_TAILLE: 68,
  TOUR_BASSIN: 94,
  LONGUEUR_DOS: 40,
  LONGUEUR_BRAS: 58,
  LONGUEUR_JAMBE: 102,
  TOUR_COU: 36,
  FOURCHE: 26,
  LONGUEUR_JUPE: 65,
};

function buildPatternSheetSvg(
  projectRef: string,
  garmentType: string,
  cutType: string,
  pieces: GeneratedPatternPieceGeometryDto[],
): string {
  const sheetWidth = 1400;
  const sheetHeight = 900;

  // Lay out pieces along 2 rows
  let currentX = 60;
  let currentY = 120;
  let maxHeightInRow = 0;

  const pieceSvgElements: string[] = [];

  pieces.forEach((piece) => {

    // Determine bounds
    const minX = Math.min(...piece.outlineMm.map((p) => p.x));
    const minY = Math.min(...piece.outlineMm.map((p) => p.y));
    const maxX = Math.max(...piece.outlineMm.map((p) => p.x));
    const maxY = Math.max(...piece.outlineMm.map((p) => p.y));
    const width = Math.max(maxX - minX, 100);
    const height = Math.max(maxY - minY, 100);

    // Scale for sheet visualization (approx 0.35 scale if large)
    const scale = width > 400 || height > 500 ? 0.35 : 0.6;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    if (currentX + scaledWidth > sheetWidth - 60) {
      currentX = 60;
      currentY += maxHeightInRow + 50;
      maxHeightInRow = 0;
    }

    if (scaledHeight > maxHeightInRow) {
      maxHeightInRow = scaledHeight;
    }

    const points = piece.outlineMm
      .map((p) => `${((p.x - minX) * scale).toFixed(1)},${((p.y - minY) * scale).toFixed(1)}`)
      .join(' ');

    const grainlineX = ((piece.grainline.originX - minX) * scale).toFixed(1);
    const grainlineY = ((piece.grainline.originY - minY) * scale).toFixed(1);

    pieceSvgElements.push(`
      <g transform="translate(${currentX.toFixed(1)}, ${currentY.toFixed(1)})" class="pattern-piece">
        <!-- Contour de découpe avec marge de couture -->
        <polygon points="${points}" fill="#F6F2E9" stroke="#061938" stroke-width="2" stroke-linejoin="round" />
        <!-- Ligne d'assemblage / couture intérieure -->
        <polygon points="${points}" fill="none" stroke="#936C3E" stroke-width="1" stroke-dasharray="4,3" opacity="0.7" transform="scale(0.96) translate(4, 4)" />
        <!-- Droit-fil -->
        <line x1="${grainlineX}" y1="${grainlineY}" x2="${grainlineX}" y2="${(parseFloat(grainlineY) + 40).toFixed(1)}" stroke="#936C3E" stroke-width="1.5" marker-end="url(#arrow)" />
        <!-- Libellé de la pièce -->
        <text x="15" y="${(scaledHeight / 2).toFixed(1)}" font-family="'Inter', sans-serif" font-size="11" font-weight="600" fill="#061938">${piece.name}</text>
        <text x="15" y="${(scaledHeight / 2 + 14).toFixed(1)}" font-family="'Inter', sans-serif" font-size="9" fill="#5C697A">${Math.round(width)}mm × ${Math.round(height)}mm (Marge 10mm)</text>
      </g>
    `);

    currentX += scaledWidth + 40;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheetWidth} ${sheetHeight}" width="${sheetWidth}" height="${sheetHeight}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#936C3E" />
    </marker>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E0D6" stroke-width="0.5" />
    </pattern>
  </defs>

  <!-- Fond quadrillé atelier -->
  <rect width="100%" height="100%" fill="#FAF7F2" />
  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Cartouche En-tête Haute Couture -->
  <rect x="40" y="30" width="${sheetWidth - 80}" height="65" fill="#061938" rx="2" />
  <text x="60" y="58" font-family="'Cormorant Garamond', serif" font-size="20" fill="#F6F2E9" letter-spacing="1.5">ANGALY HAUTE COUTURE — PLANCHE DE PATRONNAGE IA</text>
  <text x="60" y="78" font-family="'Inter', sans-serif" font-size="10" fill="#C5B190" text-transform="uppercase" letter-spacing="1">Projet ${projectRef} | Modèle : ${garmentType} (Coupe ${cutType}) | ${pieces.length} Pièces tracées</text>
  <text x="${sheetWidth - 80}" y="68" text-anchor="end" font-family="'Inter', sans-serif" font-size="10" fill="#F6F2E9" opacity="0.8">Échelle 1:1 • Prêt pour coupe atelier</text>

  <!-- Pièces géométriques -->
  ${pieceSvgElements.join('\n')}

  <!-- Cartouche pied de planche -->
  <line x1="40" y1="${sheetHeight - 40}" x2="${sheetWidth - 40}" y2="${sheetHeight - 40}" stroke="#D9D4CA" stroke-width="1" />
  <text x="60" y="${sheetHeight - 22}" font-family="'Inter', sans-serif" font-size="9" fill="#8A877F">Moteur géométrique déterministe Angaly Pattern Engine v0.1.0 • Marges de couture standard 10mm incluses</text>
</svg>`;
}

@Injectable()
export class GenerateCreationProjectAiPatternUseCase {
  constructor(
    @Inject(CREATION_PROJECT_REPOSITORY)
    private readonly repository: ICreationProjectRepository,
    private readonly generatePatternPiecesUseCase: GeneratePatternPiecesUseCase,
    private readonly suggestPatternParametersUseCase: SuggestPatternParametersUseCase,
  ) {}

  async execute(
    projectId: string,
    dto: GenerateCreationProjectAiPatternDto,
    staffUserId?: string,
  ): Promise<GenerateCreationProjectAiPatternResponseDto> {
    const project = await this.repository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Projet de création introuvable : ${projectId}`);
    }

    const finalMeasurements: Record<string, number> = {
      ...DEFAULT_MEASUREMENTS,
      ...(dto.measurements ?? {}),
    };

    let aiSuggestion: GenerateCreationProjectAiPatternResponseDto['aiSuggestion'] | undefined;
    let finalCutType = dto.cutType ?? 'DROITE';
    let finalDetails = { ...(dto.details ?? {}) };

    if (dto.requestAiSuggestion !== false) {
      try {
        const result = await this.suggestPatternParametersUseCase.execute({
          garmentType: dto.garmentType,
          style: dto.style ?? null,
          occasion: null,
          measurements: finalMeasurements,
          inspirationImageUrl: null,
        });

        aiSuggestion = {
          suggestedCutType: result.suggestion.suggestedCutType,
          suggestedDetails: result.suggestion.suggestedDetails,
          confidence: result.suggestion.confidence,
          modelVersion: result.suggestion.modelVersion,
          isIndicativeOnly: result.isIndicativeOnly,
        };

        if (!dto.cutType && result.suggestion.suggestedCutType) {
          finalCutType = result.suggestion.suggestedCutType;
        }

        finalDetails = {
          ...result.suggestion.suggestedDetails,
          ...finalDetails,
        };
      } catch {
        // En cas d'erreur de service IA, dégradation gracieuse sans bloquer la géométrie
      }
    }

    const parameters = {
      garmentType: dto.garmentType,
      cutType: finalCutType,
      style: dto.style ?? null,
      details: finalDetails,
    };

    const patternResult = await this.generatePatternPiecesUseCase.execute(
      parameters,
      finalMeasurements,
    );

    const pieces: GeneratedPatternPieceGeometryDto[] = patternResult.pieces.map((p) => {
      const minX = Math.min(...p.outlineMm.map((pt) => pt.x));
      const maxX = Math.max(...p.outlineMm.map((pt) => pt.x));
      const minY = Math.min(...p.outlineMm.map((pt) => pt.y));
      const maxY = Math.max(...p.outlineMm.map((pt) => pt.y));
      return {
        name: p.name,
        outlineMm: p.outlineMm,
        seamAllowanceMm: p.seamAllowanceMm,
        grainline: p.grainline,
        notches: p.notches,
        quantity: p.quantity ?? 1,
        fabricRecommendation: p.fabricRecommendation ?? undefined,
        widthMm: Math.round(maxX - minX),
        heightMm: Math.round(maxY - minY),
      };
    });

    const svgContent = buildPatternSheetSvg(project.reference, dto.garmentType, finalCutType, pieces);
    const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;

    let savedMedia: GenerateCreationProjectAiPatternResponseDto['media'];
    let savedNote: GenerateCreationProjectAiPatternResponseDto['note'];

    if (dto.saveMedia !== false) {
      const mediaEntity = await this.repository.addStageMedia(
        projectId,
        CreationProjectStage.PATRON,
        {
          title: `Patron IA — ${dto.garmentType} (${finalCutType})`,
          fileName: `patron-${dto.garmentType.toLowerCase()}-${project.reference}.svg`,
          mimeType: 'image/svg+xml',
          sizeBytes: Buffer.byteLength(svgContent, 'utf-8'),
          url: svgDataUri,
        },
        staffUserId ?? null,
      );

      savedMedia = {
        id: mediaEntity.id,
        projectId: mediaEntity.projectId,
        stage: mediaEntity.stage,
        url: mediaEntity.url,
        title: mediaEntity.title,
        fileName: mediaEntity.fileName,
        mimeType: mediaEntity.mimeType,
        sizeBytes: mediaEntity.sizeBytes,
        uploadedByEmail: null,
        createdAt: mediaEntity.createdAt.toISOString(),
      };
    }

    if (dto.addNote !== false) {
      const pieceNames = pieces.map((p) => p.name).join(', ');
      const noteContent = `Patron géométrique généré par IA (Angaly Pattern Studio) : ${dto.garmentType} (Coupe : ${finalCutType}). ${pieces.length} pièces tracées : ${pieceNames}. Mesures appliquées : Poitrine ${finalMeasurements.TOUR_POITRINE}cm, Taille ${finalMeasurements.TOUR_TAILLE}cm, Bassin ${finalMeasurements.TOUR_BASSIN}cm.`;

      const noteEntity = await this.repository.addStageNote(
        projectId,
        CreationProjectStage.PATRON,
        noteContent,
        staffUserId ?? null,
      );

      savedNote = {
        id: noteEntity.id,
        projectId: noteEntity.projectId,
        stage: noteEntity.stage,
        content: noteEntity.content,
        authorEmail: null,
        createdAt: noteEntity.createdAt.toISOString(),
        updatedAt: noteEntity.updatedAt.toISOString(),
      };
    }

    return {
      pieces,
      parameters: {
        garmentType: dto.garmentType,
        cutType: finalCutType,
        style: dto.style,
        details: finalDetails,
      },
      measurements: finalMeasurements,
      aiSuggestion,
      svgContent,
      svgDataUri,
      media: savedMedia,
      note: savedNote,
    };
  }
}
