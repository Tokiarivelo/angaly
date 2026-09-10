/**
 * `ProductVariant.color` is a free-form string — the two real Stitch product
 * screens even use different naming vocabularies for the same hues
 * (catalogue: "Navy"/"White"/"Black"…, product detail: "Bleu Nuit"/
 * "Champagne"…). Neither backend model stores a hex code per color, so this
 * is a best-effort display lookup, not a source of truth — an unrecognized
 * name falls back to a neutral bordered dot rather than guessing wrong.
 */
export const COLOR_SWATCH_HEX: Record<string, string> = {
  Navy: '#061938',
  'Bleu Nuit': '#061938',
  Bleu: '#1E4574',
  White: '#FFFFFF',
  Blanc: '#FFFFFF',
  Ivoire: '#F6F2E9',
  Ivory: '#F6F2E9',
  Champagne: '#C5B190',
  Black: '#000000',
  Noir: '#000000',
  Grey: '#8A877F',
  Gris: '#8A877F',
  Or: '#936C3E',
  Gold: '#936C3E',
  Bordeaux: '#5C1A1A',
  Rose: '#D8B4B0',
};

export const NEUTRAL_SWATCH_FALLBACK_HEX = '#D9D4CA';

export function getColorSwatchHex(colorName: string): string {
  return COLOR_SWATCH_HEX[colorName] ?? NEUTRAL_SWATCH_FALLBACK_HEX;
}
