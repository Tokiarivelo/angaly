import { describe, expect, it } from 'vitest';
import { bodyLandmarks, buildTorsoRings, ellipseCircumference, readBodyMeasurements, ringAt } from '../utils/garment3d/body-model';

const BASE = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const girthAt = (m: Record<string, number>, y: (l: ReturnType<typeof bodyLandmarks>) => number): number => {
  const body = readBodyMeasurements(m, 'FEMME_STANDARD');
  const r = ringAt(buildTorsoRings(body), y(bodyLandmarks(body)));
  return ellipseCircumference(r.a, r.b);
};

describe('the 3D mannequin is built from the measurements entered', () => {
  it('takes its stature from STATURE, else from the waist height or the outer leg length', () => {
    expect(readBodyMeasurements({ ...BASE, STATURE: 158 }).height).toBeCloseTo(1.58, 3);
    expect(readBodyMeasurements({ ...BASE, HAUTEUR_TAILLE_SOL: 108 }).height).toBeCloseTo(1.8, 2);
    const fromLeg = readBodyMeasurements({ ...BASE, LONGUEUR_JAMBE: 100 });
    // The outer leg runs from the waist to the ankle: the waist then stands that far above the ankle.
    const l = bodyLandmarks(fromLeg);
    expect(l.waistY - l.ankleY).toBeCloseTo(1, 2);
  });

  it('puts the waist at the measured waist height and the crotch at the measured inseam', () => {
    const body = readBodyMeasurements({ ...BASE, STATURE: 170, HAUTEUR_TAILLE_SOL: 106, HAUTEUR_ENTREJAMBE: 74 });
    const l = bodyLandmarks(body);
    expect(l.waistY).toBeCloseTo(1.06, 3);
    expect(l.crotchY - l.ankleY).toBeCloseTo(0.74, 3);
  });

  it('sets the knee line from HAUTEUR_TAILLE_GENOU, else where the pattern drafts it', () => {
    const measured = bodyLandmarks(readBodyMeasurements({ ...BASE, HAUTEUR_TAILLE_GENOU: 58 }));
    expect(measured.waistY - measured.kneeY).toBeCloseTo(0.58, 3);
    const drafted = bodyLandmarks(readBodyMeasurements(BASE));
    expect((drafted.crotchY - drafted.kneeY) / (drafted.crotchY - drafted.ankleY)).toBeCloseTo(0.47, 3);
  });

  it('shapes the chest from the upper-bust and under-bust girths, and drops the bust point to HAUTEUR_POITRINE', () => {
    const upper = (l: ReturnType<typeof bodyLandmarks>): number => l.shoulderY - 0.04;
    const under = (l: ReturnType<typeof bodyLandmarks>): number => l.bustY - 0.11;
    expect(girthAt({ ...BASE, TOUR_HAUT_POITRINE: 80 }, upper)).toBeLessThan(girthAt(BASE, upper) - 0.03);
    expect(girthAt({ ...BASE, TOUR_SOUS_POITRINE: 76 }, under)).toBeLessThan(girthAt(BASE, under) - 0.01);
    const low = bodyLandmarks(readBodyMeasurements({ ...BASE, HAUTEUR_POITRINE: 30 }));
    const high = bodyLandmarks(readBodyMeasurements({ ...BASE, HAUTEUR_POITRINE: 22 }));
    expect(high.bustY - low.bustY).toBeCloseTo(0.08 * 0.58, 3);
  });

  it('takes the shoulder width from the carrure as the pattern does (back, else front, else LARGEUR_EPAULE)', () => {
    expect(readBodyMeasurements({ ...BASE, CARRURE_DOS: 40, LARGEUR_EPAULE: 10 }).shoulderWidth).toBeCloseTo(0.38, 3);
    expect(readBodyMeasurements({ ...BASE, CARRURE_DEVANT: 34 }).shoulderWidth).toBeCloseTo(0.34, 3);
    // Size M's carrure (37 cm) gives the template's own shoulders.
    expect(readBodyMeasurements({ ...BASE, CARRURE_DOS: 37 }).shoulderWidth).toBeCloseTo(readBodyMeasurements(BASE).shoulderWidth, 2);
  });

  it('drops the shoulder point PENTE_EPAULE below the base of the neck, within the pattern-engine bounds', () => {
    const square = bodyLandmarks(readBodyMeasurements({ ...BASE, PENTE_EPAULE: 2.5 }));
    const sloping = bodyLandmarks(readBodyMeasurements({ ...BASE, PENTE_EPAULE: 7 }));
    expect(square.napeY - square.shoulderY).toBeCloseTo(0.025, 4);
    expect(sloping.napeY - sloping.shoulderY).toBeCloseTo(0.07, 4);
    expect(readBodyMeasurements({ ...BASE, PENTE_EPAULE: 0.5 }).shoulderDrop).toBeCloseTo(0.015, 4);
  });

  it('keeps the old mannequin when none of these is measured', () => {
    const body = readBodyMeasurements(BASE, 'FEMME_STANDARD');
    expect(body.height).toBeCloseTo(1.7, 3);
    expect(body.upperBust).toBeUndefined();
    expect(body.kneeY).toBeUndefined();
    expect(body.shoulderDrop).toBeUndefined();
    expect(bodyLandmarks(body).napeY - bodyLandmarks(body).shoulderY).toBeCloseTo(0.05, 4);
  });
});
