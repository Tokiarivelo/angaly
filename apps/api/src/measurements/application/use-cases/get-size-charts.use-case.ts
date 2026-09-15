import { Injectable } from '@nestjs/common';
import {
  SizeChartEntry,
  SizeChartGender,
  STANDARD_SIZE_CHARTS,
} from '@angaly/types';

/**
 * Serves the static AFNOR/ISO 8559-1 standard size reference tables
 * (packages/types/src/size-charts.ts) so the Pattern Studio wizard can offer
 * "taille standard" (XS/S/M/L/XL…) as an alternative to manual measurements.
 * Purely static reference data — no persistence involved.
 */
@Injectable()
export class GetSizeChartsUseCase {
  execute(gender?: SizeChartGender): Record<SizeChartGender, SizeChartEntry[]> | SizeChartEntry[] {
    if (gender) {
      return STANDARD_SIZE_CHARTS[gender];
    }
    return STANDARD_SIZE_CHARTS;
  }
}
