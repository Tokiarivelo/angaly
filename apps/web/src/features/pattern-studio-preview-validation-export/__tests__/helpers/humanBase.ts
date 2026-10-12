import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { HumanBaseData } from '../../utils/garment3d/human-body';

/** Reads the real asset (public/models/human-base.glb) so fits are tested on the actual mesh. */
export const loadHumanBase = (): HumanBaseData & { indices: Uint32Array } => {
  const buf = readFileSync(resolve(__dirname, '../../../../../public/models/human-base.glb'));
  const jsonLength = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLength).toString()) as {
    accessors: Array<{ bufferView: number }>;
    bufferViews: Array<{ byteOffset: number; byteLength: number }>;
    meshes: Array<{ primitives: Array<{ attributes: { POSITION: number }; indices: number; targets: Array<{ POSITION: number }> }>; extras: Record<string, never> }>;
  };
  const bin = buf.subarray(20 + jsonLength + 8);
  const slice = (accessor: number): ArrayBuffer => {
    const view = json.bufferViews[json.accessors[accessor]!.bufferView]!;
    return bin.buffer.slice(bin.byteOffset + view.byteOffset, bin.byteOffset + view.byteOffset + view.byteLength) as ArrayBuffer;
  };
  const mesh = json.meshes[0]!;
  const primitive = mesh.primitives[0]!;
  const extras = mesh.extras as unknown as {
    morphNames: string[];
    armWeights: number[];
    landmarksFemale: number[];
    landmarksMale: number[];
    landmarksFemaleChild: number[];
    landmarksMaleChild: number[];
  };
  const morphs: Record<string, Float32Array> = {};
  extras.morphNames.forEach((name, i) => {
    morphs[name] = new Float32Array(slice(primitive.targets[i]!.POSITION));
  });
  return {
    positions: new Float32Array(slice(primitive.attributes.POSITION)),
    indices: new Uint32Array(slice(primitive.indices)),
    morphs,
    armWeights: Float32Array.from(extras.armWeights),
    landmarksFemale: extras.landmarksFemale,
    landmarksMale: extras.landmarksMale,
    landmarksFemaleChild: extras.landmarksFemaleChild,
    landmarksMaleChild: extras.landmarksMaleChild,
  };
};
