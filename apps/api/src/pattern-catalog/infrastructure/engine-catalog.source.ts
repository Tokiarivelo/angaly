import { Injectable } from '@nestjs/common';
import { CATALOG_MEASUREMENTS, DRESS_CATALOG, PatternEngine, catalogGroupOf, createDefaultEngine, type DressCase } from '@angaly/pattern-engine';

import type { CatalogEntry, CatalogInspirationCredit, IPatternCatalogSource } from '../domain/catalog-entry';
import credits from './data/catalog-inspirations.json';

type CreditFile = Record<string, CatalogInspirationCredit>;

/** Extended parameters of a catalogue dress, as stored on a project (`parametersExtJson`). */
const extOf = (c: DressCase): Record<string, unknown> => {
  const p = c.parameters;
  return {
    ...(p.ease ? { ease: p.ease } : {}),
    ...(p.fullness ? { fullness: p.fullness } : {}),
    ...(p.lengths ? { lengths: p.lengths } : {}),
    ...(p.drape ? { drape: p.drape } : {}),
    ...(p.trims ? { trims: p.trims } : {}),
    ...(p.construction ? { construction: p.construction } : {}),
    ...(p.fabric ? { fabric: p.fabric } : {}),
  };
};

/**
 * The catalogue served to customers: the pattern engine's own dress catalogue, each dress generated once at the
 * reference measurements (deterministic) to give its piece list and yardage.
 */
@Injectable()
export class EngineCatalogSource implements IPatternCatalogSource {
  private entries: CatalogEntry[] | null = null;
  private readonly engine: PatternEngine = createDefaultEngine();

  list(): CatalogEntry[] {
    this.entries ??= DRESS_CATALOG.map((c) => this.entryOf(c));
    return this.entries;
  }

  find(id: string): CatalogEntry | null {
    return this.list().find((e) => e.id === id) ?? null;
  }

  private entryOf(c: DressCase): CatalogEntry {
    const result = this.engine.generate(c.parameters, CATALOG_MEASUREMENTS);
    const yardage = result.metadata.yardage?.lengthMm;
    return {
      id: c.id,
      title: c.title,
      era: c.era,
      notes: c.notes,
      group: catalogGroupOf(c),
      pieceCount: result.pieces.length,
      yardageM: yardage !== undefined ? Math.round(yardage / 10) / 100 : null,
      pieces: result.pieces.map((p) => ({ name: p.name, quantity: p.quantity })),
      template: {
        garmentType: c.parameters.garmentType,
        cutType: c.parameters.cutType,
        details: { ...c.parameters.details },
        parametersExt: extOf(c),
        look: c.look ? { ...c.look } : null,
      },
      credit: (credits as CreditFile)[c.id] ?? null,
    };
  }
}
