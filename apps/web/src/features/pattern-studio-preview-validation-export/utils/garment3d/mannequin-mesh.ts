import * as THREE from 'three';
import type { BodyLandmarks, BodyRing } from './body-model';
import { ringAt } from './body-model';

/**
 * Procedural geometries for the Haute Couture atelier mannequin.
 * Replaces crude potato-like sphere/cylinder blobs with sculptured,
 * high-fashion atelier dress-form anatomy, Stockman Paris style markings,
 * and elegant couture accessories.
 */

/**
 * Stylized Haute Couture mannequin head with sculpted cranial dome,
 * refined cheekbone planes, elegant jawline, and tapered couture chin.
 */
export const createCoutureHeadGeometry = (headRadius: number): THREE.BufferGeometry => {
  const slices = 40;
  const radialSegments = 48;
  const totalHeight = headRadius * 2.15;
  const sHead = headRadius / 0.095;

  // Normalized height v from chin (0) to crown (1): [v, widthRatio, depthRatio, centerZ]
  const profile: Array<[number, number, number, number]> = [
    [0.0, 0.16, 0.24, 0.046],    // Chin apex (mental protuberance)
    [0.04, 0.28, 0.36, 0.042],   // Chin taper
    [0.10, 0.46, 0.54, 0.034],   // Lower jaw (mandibular body)
    [0.18, 0.62, 0.68, 0.024],   // Jawline angle (gonial angle)
    [0.28, 0.72, 0.78, 0.016],   // Lower face / oral plane
    [0.38, 0.78, 0.85, 0.010],   // Subnasal / maxilla
    [0.48, 0.85, 0.92, 0.005],   // Zygomatic arch apex (high cheekbones)
    [0.58, 0.89, 0.96, 0.000],   // Temple / ocular plane
    [0.68, 0.90, 0.96, -0.006],  // Supraorbital brow ridge
    [0.78, 0.88, 0.94, -0.012],  // Forehead plane
    [0.88, 0.80, 0.86, -0.018],  // Cranial parietal vault
    [0.95, 0.54, 0.60, -0.022],  // Upper skull
    [1.0, 0.04, 0.04, -0.025],   // Crown apex
  ];

  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= slices; i += 1) {
    const v = i / slices;
    let k = 0;
    while (k < profile.length - 2 && profile[k + 1]![0] < v) k += 1;
    const [v0, w0, d0, z0] = profile[k]!;
    const [v1, w1, d1, z1] = profile[k + 1]!;
    const t = (v - v0) / Math.max(1e-5, v1 - v0);
    const w = w0 + (w1 - w0) * t;
    const d = d0 + (d1 - d0) * t;
    const cz = z0 + (z1 - z0) * t;

    const y = v * totalHeight - totalHeight * 0.42;
    const a = w * headRadius * 0.92;
    const b = d * headRadius * 0.96;

    for (let j = 0; j < radialSegments; j += 1) {
      const phi = (j / radialSegments) * Math.PI * 2;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      // Symmetrical anterior angle from midline in [0, PI]:
      const phiFront = phi > Math.PI ? phi - 2 * Math.PI : phi;
      const absPhi = Math.abs(phiFront);

      let deltaX = 0;
      let deltaZ = 0;

      // 1. Nose bridge, tip and nostrils (v in [0.36, 0.54]):
      if (v >= 0.36 && v <= 0.54 && cosP > 0.70) {
        const tNoseV = Math.sin(((v - 0.36) / 0.18) * Math.PI);
        const noseAngle = Math.exp(-(phiFront * phiFront) / (2 * 0.14 * 0.14));
        deltaZ += 0.015 * sHead * tNoseV * noseAngle;
        // Alar nostril flare:
        if (v <= 0.42) {
          const alarLobe = Math.exp(-Math.pow(absPhi - 0.20, 2) / (2 * 0.07 * 0.07));
          deltaX += Math.sign(sinP) * 0.003 * sHead * alarLobe;
        }
      }

      // 2. Lips, philtrum and mouth fissure (v in [0.24, 0.36]):
      if (v >= 0.24 && v <= 0.36 && cosP > 0.75) {
        const lipAngle = Math.exp(-(phiFront * phiFront) / (2 * 0.26 * 0.26));
        if (v > 0.30) {
          // Upper lip with subtle cupid's bow:
          const tUpper = Math.sin(((v - 0.30) / 0.06) * Math.PI);
          const cupid = 1 - 0.18 * Math.exp(-(phiFront * phiFront) / 0.02);
          deltaZ += 0.0055 * sHead * tUpper * lipAngle * cupid;
        } else {
          // Lower lip:
          const tLower = Math.sin(((v - 0.24) / 0.06) * Math.PI);
          deltaZ += 0.0065 * sHead * tLower * lipAngle;
        }
      }

      // 3. Eye sockets and supraorbital brow (v in [0.54, 0.68]):
      if (v >= 0.54 && v <= 0.68 && cosP > 0.65) {
        if (v <= 0.62) {
          // Orbital eye socket recession:
          const eyeV = Math.exp(-Math.pow(v - 0.58, 2) / (2 * 0.04 * 0.04));
          const eyePhi = Math.exp(-Math.pow(absPhi - 0.32, 2) / (2 * 0.12 * 0.12));
          deltaZ -= 0.004 * sHead * eyeV * eyePhi;
        } else {
          // Supraorbital brow ridge:
          const browV = Math.exp(-Math.pow(v - 0.65, 2) / (2 * 0.04 * 0.04));
          const browPhi = Math.exp(-Math.pow(absPhi - 0.28, 2) / (2 * 0.16 * 0.16));
          deltaZ += 0.004 * sHead * browV * browPhi;
        }
      }

      // 4. Ears on lateral sides (v in [0.38, 0.58]):
      const dPhiEar = Math.min(Math.abs(phi - Math.PI * 0.5), Math.abs(phi - Math.PI * 1.5));
      if (v >= 0.38 && v <= 0.58 && dPhiEar < 0.35) {
        const earV = Math.sin(((v - 0.38) / 0.20) * Math.PI);
        const earPhi = Math.exp(-(dPhiEar * dPhiEar) / (2 * 0.15 * 0.15));
        deltaX += Math.sign(sinP) * 0.012 * sHead * earV * earPhi;
        deltaZ -= 0.003 * sHead * earV * earPhi;
      }

      // 5. High cheekbone planes:
      let planeModX = 1.0;
      if (v >= 0.35 && v <= 0.65) {
        const cheekT = Math.sin(((v - 0.35) / 0.30) * Math.PI);
        planeModX += 0.04 * cheekT * Math.abs(Math.sin(2 * phi));
      } else if (v < 0.22) {
        planeModX *= 0.92;
      }

      positions.push(
        a * sinP * planeModX + deltaX,
        y,
        b * cosP + cz + deltaZ,
      );
    }
  }

  for (let i = 0; i < slices; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const next = (j + 1) % radialSegments;
      const p1 = i * radialSegments + j;
      const p2 = i * radialSegments + next;
      const p3 = (i + 1) * radialSegments + j;
      const p4 = (i + 1) * radialSegments + next;
      indices.push(p1, p3, p2, p2, p3, p4);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

/**
 * Modern sculpted hairstyle coiffure framing the face and cranial vault,
 * giving the figure lifelike presence instead of a bald dummy.
 */
export const createHairGeometry = (headRadius: number): THREE.BufferGeometry => {
  const slices = 24;
  const radialSegments = 36;
  const totalHeight = headRadius * 2.15;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= slices; i += 1) {
    const v = 0.35 + (i / slices) * 0.65;
    const y = v * totalHeight - totalHeight * 0.42;

    for (let j = 0; j < radialSegments; j += 1) {
      const phi = (j / radialSegments) * Math.PI * 2;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      const frontHairline = 0.70 - 0.22 * Math.max(0, -cosP) - 0.12 * Math.abs(sinP);
      let hairLift = 0;

      if (v >= frontHairline) {
        const t = (v - frontHairline) / (1.0 - frontHairline);
        hairLift = 0.006 * (headRadius / 0.095) * (0.8 + 0.4 * Math.sin(t * Math.PI));
        if (cosP < -0.3) {
          hairLift += 0.008 * (headRadius / 0.095) * (-cosP - 0.3);
        }
      }

      const r = headRadius * 0.94 + hairLift;
      const px = r * sinP * 0.96;
      const py = y + hairLift * 0.5;
      const pz = r * cosP * 0.98;

      positions.push(px, py, pz);
    }
  }

  for (let i = 0; i < slices; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const next = (j + 1) % radialSegments;
      const p1 = i * radialSegments + j;
      const p2 = i * radialSegments + next;
      const p3 = (i + 1) * radialSegments + j;
      const p4 = (i + 1) * radialSegments + next;
      indices.push(p1, p3, p2, p2, p3, p4);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

/**
 * Graceful real person hand with contoured palm, thenar pad, and
 * 4 sculpted fingers with gentle natural relaxed curl.
 */
export const createCoutureHandGeometry = (scale: number, side: 1 | -1): THREE.BufferGeometry => {
  const l = 0.115 * scale;
  const w = 0.033 * scale;
  const d = 0.016 * scale;

  const slices = 20;
  const radialSegments = 28;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= slices; i += 1) {
    const v = i / slices;
    const y = -v * l;
    let rx: number;
    let rz: number;
    let ox = 0;
    let oz = 0;

    if (v < 0.20) {
      // Wrist transition (oval cross section)
      const u = v / 0.20;
      rx = w * 0.55 * (0.85 + u * 0.25);
      rz = d * 0.65;
    } else if (v < 0.55) {
      // Palm, thenar (thumb pad) and metacarpal arch
      const u = (v - 0.20) / 0.35;
      rx = w * (0.82 + 0.32 * Math.sin(u * Math.PI));
      rz = d * (0.85 + 0.25 * Math.sin(u * Math.PI));
      ox = side * 0.0035 * scale * Math.sin(u * Math.PI);
      oz = 0.002 * scale * u;
    } else {
      // 4 distinct sculpted fingers in natural relaxed flexion
      const u = (v - 0.55) / 0.45;
      rx = w * (0.86 - 0.60 * u);
      rz = d * (0.80 - 0.58 * u);
      oz = 0.006 * scale * Math.sin(u * Math.PI * 0.75);
      ox = side * 0.002 * scale * (1 - u);
    }

    for (let j = 0; j < radialSegments; j += 1) {
      const phi = (j / radialSegments) * Math.PI * 2;

      let digitFlute = 0;
      if (v >= 0.55) {
        const u = (v - 0.55) / 0.45;
        digitFlute = 0.06 * u * Math.cos(4 * phi);
      }

      const px = (rx * (1 + digitFlute)) * Math.sin(phi) + ox;
      const pz = (rz * (1 + digitFlute)) * Math.cos(phi) + oz;

      positions.push(px, y, pz);
    }
  }

  for (let i = 0; i < slices; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const next = (j + 1) % radialSegments;
      const p1 = i * radialSegments + j;
      const p2 = i * radialSegments + next;
      const p3 = (i + 1) * radialSegments + j;
      const p4 = (i + 1) * radialSegments + next;
      indices.push(p1, p3, p2, p2, p3, p4);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

/**
 * Realistic human foot form with anatomical heel, medial instep arch,
 * ball of foot, and sculpted toes with natural toe spring.
 */
export const createCoutureFootGeometry = (scale: number): THREE.BufferGeometry => {
  const totalLength = 0.20 * scale;
  const width = 0.052 * scale;
  const height = 0.056 * scale;

  const slices = 20;
  const radialSegments = 24;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= slices; i += 1) {
    const u = i / slices;
    const z = (u - 0.32) * totalLength;

    let w = width;
    let h = height;
    let yBottom = 0;

    if (u < 0.22) {
      const t = u / 0.22;
      w = width * (0.65 + 0.35 * Math.sin(t * Math.PI * 0.5));
      h = height * (0.85 + 0.15 * t);
      yBottom = 0;
    } else if (u < 0.55) {
      const t = (u - 0.22) / 0.33;
      w = width * (0.85 - 0.10 * Math.sin(t * Math.PI));
      h = height * (1.0 + 0.12 * Math.sin(t * Math.PI));
      yBottom = 0.012 * scale * Math.sin(t * Math.PI);
    } else if (u < 0.78) {
      const t = (u - 0.55) / 0.23;
      w = width * (0.85 + 0.15 * Math.sin(t * Math.PI * 0.5));
      h = height * (0.85 - 0.25 * t);
      yBottom = 0;
    } else {
      const t = (u - 0.78) / 0.22;
      w = width * (0.95 - 0.70 * t);
      h = height * (0.60 - 0.45 * t);
      yBottom = 0.007 * scale * t;
    }

    const rx = w * 0.5;
    const ry = h * 0.5;
    const cy = yBottom + ry;

    for (let j = 0; j < radialSegments; j += 1) {
      const phi = (j / radialSegments) * Math.PI * 2;

      let toeFlute = 0;
      if (u >= 0.78) {
        toeFlute = 0.05 * Math.cos(5 * phi);
      }

      const px = (rx * (1 + toeFlute)) * Math.sin(phi);
      const py = cy + (ry * (1 + toeFlute)) * Math.cos(phi);
      positions.push(px, py, z);
    }
  }

  for (let i = 0; i < slices; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const next = (j + 1) % radialSegments;
      const p1 = i * radialSegments + j;
      const p2 = i * radialSegments + next;
      const p3 = (i + 1) * radialSegments + j;
      const p4 = (i + 1) * radialSegments + next;
      indices.push(p1, p3, p2, p2, p3, p4);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

/**
 * Anatomically contoured limb segment (upper arm, forearm, thigh, calf)
 * with natural muscular tapering and graceful curves, avoiding sausage tubes.
 */
export const createContouredLimbGeometry = (
  radiusTop: number,
  radiusBottom: number,
  length: number,
  limbType: 'upperArm' | 'forearm' | 'thigh' | 'calf' | 'neck',
): THREE.BufferGeometry => {
  const slices = 24;
  const radialSegments = 32;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= slices; i += 1) {
    const t = i / slices; // 0 = top, 1 = bottom
    const y = (0.5 - t) * length;
    const baseRadius = radiusTop + (radiusBottom - radiusTop) * t;

    let swell = 1.0;
    let aspectX = 1.0;
    let aspectZ = 1.0;
    let zCenter = 0;

    if (limbType === 'upperArm') {
      // Deltoid flare at top, biceps anterior swell, triceps posterior curve:
      swell = 1.0 + 0.08 * Math.sin(t * Math.PI);
      aspectZ = 1.02;
      zCenter = 0.002 * Math.sin(t * Math.PI);
    } else if (limbType === 'forearm') {
      // Anatomical oval cross-section (wider laterally than antero-posteriorly):
      aspectX = 1.15;
      aspectZ = 0.90;
      // Brachioradialis flare in upper third, slender wrist:
      swell = 1.0 + 0.12 * Math.sin(Math.pow(t, 0.65) * Math.PI);
    } else if (limbType === 'thigh') {
      // Quadriceps curvature (rectus femoris and vastus):
      swell = 1.0 + 0.09 * Math.sin(Math.pow(t, 0.75) * Math.PI);
      zCenter = 0.004 * Math.sin(t * Math.PI);
    } else if (limbType === 'calf') {
      // Gastrocnemius calf flare in upper half, slender Achilles tendon:
      swell = 1.0 + 0.15 * Math.sin(Math.pow(t, 0.55) * Math.PI);
      zCenter = -0.003 * Math.sin(Math.pow(t, 0.55) * Math.PI);
    } else if (limbType === 'neck') {
      // Subtle throat contour and trapezius slope:
      swell = 1.0 - 0.03 * Math.sin(t * Math.PI);
      zCenter = 0.002 * (1 - t);
    }

    const rx = baseRadius * swell * aspectX;
    const rz = baseRadius * swell * aspectZ;

    for (let j = 0; j < radialSegments; j += 1) {
      const phi = (j / radialSegments) * Math.PI * 2;
      positions.push(rx * Math.sin(phi), y, rz * Math.cos(phi) + zCenter);
    }
  }

  for (let i = 0; i < slices; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const next = (j + 1) % radialSegments;
      const p1 = i * radialSegments + j;
      const p2 = i * radialSegments + next;
      const p3 = (i + 1) * radialSegments + j;
      const p4 = (i + 1) * radialSegments + next;
      indices.push(p1, p3, p2, p2, p3, p4);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

/**
 * Stockman Paris style markings for the atelier dress form:
 * - Center Front (milieu devant) & Center Back (milieu dos) seam lines
 * - Waistline ribbon (ruban de taille) in Antique Gold
 * - Bustline ribbon (ruban de poitrine) in Antique Gold
 */
export const createAtelierRibbons = (
  rings: BodyRing[],
  landmarks: BodyLandmarks,
): { seamLines: THREE.BufferGeometry; tapeLines: THREE.BufferGeometry } => {
  const seamPts: number[] = [];
  const tapePts: number[] = [];

  // Center Front (phi = 0) and Center Back (phi = PI) down the torso
  for (let i = 0; i < rings.length - 1; i += 1) {
    const r1 = rings[i]!;
    const r2 = rings[i + 1]!;
    const cz1 = r1.cz ?? 0;
    const cz2 = r2.cz ?? 0;
    // Front seam line (slightly raised from surface)
    seamPts.push(
      0, r1.y, r1.b + cz1 + 0.0015,
      0, r2.y, r2.b + cz2 + 0.0015,
    );
    // Back seam line
    seamPts.push(
      0, r1.y, -r1.b + cz1 - 0.0015,
      0, r2.y, -r2.b + cz2 - 0.0015,
    );
  }

  // Horizontal tape loops at Bust and Waist
  const addTapeLoop = (y: number) => {
    const ring = ringAt(rings, y);
    const cz = ring.cz ?? 0;
    const segments = 36;
    for (let j = 0; j < segments; j += 1) {
      const phi1 = (j / segments) * Math.PI * 2;
      const phi2 = ((j + 1) / segments) * Math.PI * 2;
      tapePts.push(
        ring.a * Math.sin(phi1) * 1.002, ring.y, ring.b * Math.cos(phi1) * 1.002 + cz,
        ring.a * Math.sin(phi2) * 1.002, ring.y, ring.b * Math.cos(phi2) * 1.002 + cz,
      );
    }
  };

  addTapeLoop(landmarks.bustY);
  addTapeLoop(landmarks.waistY);

  const seamGeo = new THREE.BufferGeometry();
  seamGeo.setAttribute('position', new THREE.Float32BufferAttribute(seamPts, 3));

  const tapeGeo = new THREE.BufferGeometry();
  tapeGeo.setAttribute('position', new THREE.Float32BufferAttribute(tapePts, 3));

  return { seamLines: seamGeo, tapeLines: tapeGeo };
};
