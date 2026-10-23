import { describe, expect, it } from 'vitest';
import {
  clothRoleForMaterial,
  motifForMaterial,
  panelMotifs,
  isRenderPending,
  RENDER_STATUS_LABELS,
  simulatedPose,
  toRenderPose,
} from '../utils/realistic-render';
import { POSE_PRESETS } from '../utils/garment3d/pose';

describe('realistic render helpers', () => {
  it('maps the preview pose presets onto the simulated ones', () => {
    expect(toRenderPose('NEUTRE')).toBe('NEUTRE');
    expect(toRenderPose('MIROIR')).toBe('MIROIR');
    expect(toRenderPose('PRESENTATION')).toBe('PRESENTATION');
    expect(toRenderPose('CUSTOM')).toBe('PRESENTATION');
  });

  it('tells pending renders apart', () => {
    expect(isRenderPending('QUEUED')).toBe(true);
    expect(isRenderPending('RUNNING')).toBe(true);
    expect(isRenderPending('DONE')).toBe(false);
    expect(isRenderPending('FAILED')).toBe(false);
    expect(isRenderPending(undefined)).toBe(false);
    expect(Object.keys(RENDER_STATUS_LABELS)).toHaveLength(4);
  });

  it('reads the fabric role off the .glb material names', () => {
    expect(clothRoleForMaterial('bodice-front')).toBe('dress');
    expect(clothRoleForMaterial('skirt-plastron')).toBe('plastron');
    expect(clothRoleForMaterial('plastron-x')).toBe('plastron');
    expect(clothRoleForMaterial('sleeve-cmv84l1oh0019pc5v1hledie5--1:accent')).toBe('accent');
    expect(clothRoleForMaterial('belt-cmv84l1oh0015pc5ve596nmog')).toBe('dress');
    expect(clothRoleForMaterial('')).toBe('dress');
  });

  it('poses the mannequin as simulated', () => {
    const limb = (raise: number) => ({ raise, forward: 0, twist: 0, bend: 6 });
    const simPose = { leftArm: limb(-7.5), rightArm: limb(-7.5), leftLeg: limb(0), rightLeg: limb(0) };
    const pose = simulatedPose({ pose: 'PRESENTATION', simPose });
    expect(pose.leftArm.raise).toBe(-7.5);
    expect(pose.rightLeg.bend).toBe(6);
  });

  it('falls back on the requested preset when the simulated pose is missing or malformed', () => {
    const preset = POSE_PRESETS.PRESENTATION.pose;
    expect(simulatedPose({ pose: 'PRESENTATION', simPose: null })).toEqual(preset);
    expect(simulatedPose({ pose: 'PRESENTATION', simPose: { leftArm: 'up' } })).toEqual(preset);
    expect(
      simulatedPose({
        pose: 'NEUTRE',
        simPose: { leftArm: { raise: 'x' }, rightArm: {}, leftLeg: {}, rightLeg: {} },
      }),
    ).toEqual(POSE_PRESETS.NEUTRE.pose);
  });
});

describe('motifs of the simulated garment', () => {
  const motifs = panelMotifs([
    { id: 'bodice-front-detail-0-1', motif: 'SMOCKS' },
    { id: 'skirt-front-detail-1-1', motif: 'BRODERIE', trimColor: '#c0392b' },
    { id: 'skirt-front', trimColor: '#ffffff' },
  ]);

  it('lists the panels drawn as a motif, by id, with their thread colour', () => {
    expect([...motifs.keys()]).toEqual(['bodice-front-detail-0-1', 'skirt-front-detail-1-1']);
    expect(motifs.get('skirt-front-detail-1-1')).toEqual({ motif: 'BRODERIE', color: '#c0392b' });
    expect(motifs.get('bodice-front-detail-0-1')).toEqual({ motif: 'SMOCKS' });
  });

  it('finds a .glb material’s motif through Blender’s suffixes, and none for plain cloth', () => {
    expect(motifForMaterial('skirt-front-detail-1-1', motifs)?.motif).toBe('BRODERIE');
    expect(motifForMaterial('bodice-front-detail-0-1.001', motifs)?.motif).toBe('SMOCKS');
    expect(motifForMaterial('bodice-front-detail-0-1:accent.002', motifs)?.motif).toBe('SMOCKS');
    expect(motifForMaterial('skirt-front', motifs)).toBeNull();
  });
});
