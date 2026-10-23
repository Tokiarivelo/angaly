import { Injectable } from '@nestjs/common';
import type { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import type {
  IRenderSourceReader,
  RenderSource,
} from '../../domain/repositories/render-source.reader';

const asObject = (value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null =>
  value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)
    ? value
    : null;

/** `{ [key]: number }` only: what the mannequin is fitted to. */
const asMeasurements = (value: unknown): Record<string, number> | null => {
  const object = asObject(value as Prisma.JsonValue);
  if (!object) return null;
  const entries = Object.entries(object).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]),
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
};

/**
 * Reads a pattern version as the simulation needs it — the same fields as `apps/cloth-sim/scripts/dump-version.sh`:
 * `parametersJson.measurements`, `parametersJson.inspiration.fabricBehavior`, the project's
 * `inspirationAnalysisJson.profile.fit`, and the pieces.
 */
@Injectable()
export class PrismaRenderSourceReader implements IRenderSourceReader {
  constructor(private readonly prisma: PrismaService) {}

  async findByVersionId(versionId: string): Promise<RenderSource | null> {
    const version = await this.prisma.patternVersion.findUnique({
      where: { id: versionId },
      include: {
        pieces: true,
        project: { select: { customerId: true, garmentType: true, inspirationAnalysisJson: true } },
      },
    });
    if (!version) return null;

    const parameters = asObject(version.parametersJson) ?? {};
    const inspiration = asObject(parameters.inspiration as Prisma.JsonValue);
    const fabricBehavior = inspiration?.fabricBehavior;
    const profile = asObject(asObject(version.project.inspirationAnalysisJson)?.profile as Prisma.JsonValue);

    return {
      versionId: version.id,
      customerId: version.project.customerId,
      garmentType: version.project.garmentType,
      measurements: asMeasurements(parameters.measurements),
      fabricBehavior: typeof fabricBehavior === 'string' ? fabricBehavior : null,
      fit: asObject(profile?.fit as Prisma.JsonValue),
      pieces: version.pieces.map((piece) => ({
        id: piece.id,
        versionId: piece.versionId,
        name: piece.name,
        dimensionsJson: asObject(piece.dimensionsJson) ?? {},
        fabricRecommendation: piece.fabricRecommendation,
        quantity: piece.quantity,
        grainlineJson: piece.grainlineJson,
        seamAllowanceCm: piece.seamAllowanceCm,
        notchesJson: piece.notchesJson,
      })),
    };
  }
}
