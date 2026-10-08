#!/usr/bin/env python3
"""Builds apps/web/public/models/human-base.glb from the MakeHuman system assets (CC0).

The MakeHuman base mesh and its macro targets were explicitly released as CC0 in September 2020
(https://github.com/makehumancommunity/makehuman, makehuman/data/3dobjs/base.obj and
makehuman/data/targets/macrodetails/*.target). Nothing is copied from MakeHuman's code (AGPL).

Output: one skinned-less triangle mesh of an adult woman (race-averaged, "young" macro) with
glTF morph targets (gender, weight, muscle) and per-vertex region data in `extras`, so the web
viewer can fit it to the customer's measurements (see utils/garment3d/human-body.ts).

Usage: python3 -I build-human-base.py <makehuman-data-dir> <out.glb>
  <makehuman-data-dir> contains base.obj and the *.target files listed in TARGETS below.
"""
import json
import struct
import sys
from pathlib import Path

import numpy as np

RACES = ('african', 'asian', 'caucasian')
UNIT = 0.1  # MakeHuman decimetres -> metres


def read_base(path):
    verts, faces, group = [], [], None
    for line in path.read_text().splitlines():
        if line.startswith('v '):
            verts.append([float(t) for t in line.split()[1:4]])
        elif line.startswith('g '):
            group = line.split()[1]
        elif line.startswith('f ') and group == 'body':
            faces.append([int(t.split('/')[0]) - 1 for t in line.split()[1:]])
    return np.array(verts), faces


def read_target(path, count):
    delta = np.zeros((count, 3))
    for line in path.read_text().splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        i, x, y, z = line.split()
        delta[int(i)] = (float(x), float(y), float(z))
    return delta


def smoothstep(lo, hi, x):
    t = np.clip((x - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3 - 2 * t)


# Half-width (dm) of the torso by height in the base mesh: anything further out is arm.
TORSO_HALF_WIDTH = [(5.6, 0.8), (5.0, 1.55), (4.5, 1.65), (3.8, 1.6), (3.3, 1.5), (2.9, 1.6),
                    (2.4, 1.7), (1.9, 1.8), (1.4, 1.9), (0.9, 2.0), (0.4, 2.2), (-0.2, 2.6)]


def main(data_dir, out_path):
    data = Path(data_dir)
    verts, faces = read_base(data / 'base.obj')
    used = np.array(sorted({i for f in faces for i in f}))
    remap = {int(old): new for new, old in enumerate(used)}
    n_all = len(verts)

    def target(name):
        return read_target(data / name, n_all)

    def race(gender, age='young'):
        return sum(target(f'{r}-{gender}-{age}.target') for r in RACES) / len(RACES)

    female = verts + race('female')
    male = verts + race('male')
    female_child = verts + race('female', 'child')
    male_child = verts + race('male', 'child')
    morphs = {
        'gender': male - female,
        'femaleHeavy': target('universal-female-young-averagemuscle-maxweight.target'),
        'femaleLight': target('universal-female-young-averagemuscle-minweight.target'),
        'femaleMuscle': target('universal-female-young-maxmuscle-averageweight.target'),
        'maleHeavy': target('universal-male-young-averagemuscle-maxweight.target'),
        'maleLight': target('universal-male-young-averagemuscle-minweight.target'),
        'maleMuscle': target('universal-male-young-maxmuscle-averageweight.target'),
        'childFemale': female_child - female,
        'childMale': male_child - male,
    }

    base = female[used]
    y_min = base[:, 1].min()

    def to_m(p, shift=True):
        q = p * UNIT
        if shift:
            q = q - np.array([0.0, y_min * UNIT, 0.0])
        return q.astype(np.float32)

    positions = to_m(base)
    deltas = {k: to_m(v[used], shift=False) for k, v in morphs.items()}
    tris = []
    for f in faces:
        a, b, c, d = (remap[i] for i in f)
        tris += [[a, b, c], [a, c, d]]
    indices = np.array(tris, dtype=np.uint32)

    # Per-vertex arm weight (0 torso/legs/head, 1 arm) from the base shape.
    ys, ws = zip(*sorted(TORSO_HALF_WIDTH))
    half_width = np.interp(base[:, 1], ys, ws)
    arm = smoothstep(half_width - 0.05, half_width + 0.4, np.abs(base[:, 0]))
    arm *= (base[:, 1] > 0.0)  # arms hang above y = 0 dm only
    arm *= 1.0 - smoothstep(5.0, 5.45, base[:, 1])  # the neck and the head are never arm

    # Landmark heights (m, feet = 0) of a shape, for the vertical warp. Everything is found relative
    # to the shape's own height so the same code serves the adult and the child shapes.
    def landmarks(shape):
        sh = shape[used]
        top = sh[:, 1].max()
        height = top - y_min
        torso = sh[arm < 0.5]
        # Crotch: lowest point where the body is still joined across the middle.
        mid = sh[(np.abs(sh[:, 0]) < 0.12) & (sh[:, 1] > y_min + 0.30 * height) & (sh[:, 1] < y_min + 0.60 * height)]
        crotch = mid[:, 1].min()

        def band(lo, hi, pick):
            """Centre height of the widest/narrowest 2 cm band of the torso between lo and hi (dm)."""
            bins = np.arange(lo, hi, 0.2)
            widths = []
            for b0 in bins:
                m = (torso[:, 1] >= b0) & (torso[:, 1] < b0 + 0.2)
                widths.append(np.abs(torso[m, 0]).max() if m.any() else np.nan)
            return bins[pick(widths)] + 0.1

        hip = band(crotch + 0.05 * height, crotch + 0.18 * height, np.nanargmax)
        waist = band(hip + 0.06 * height, hip + 0.2 * height, np.nanargmin)
        nape = y_min + 0.829 * height  # C7 sits at ~83 % of the stature
        bust = waist + 0.46 * (nape - waist)
        return [0.0] + [float((v - y_min) * UNIT) for v in (crotch, hip, waist, bust, nape, top)]

    extras = {
        'source': 'MakeHuman system assets (CC0 1.0), base mesh hm08 + macro targets',
        'morphNames': list(morphs.keys()),
        'armWeights': [round(float(w), 3) for w in arm],
        'landmarksFemale': landmarks(female),
        'landmarksMale': landmarks(male),
        'landmarksFemaleChild': landmarks(female_child),
        'landmarksMaleChild': landmarks(male_child),
        'landmarkNames': ['floor', 'crotch', 'hip', 'waist', 'bust', 'nape', 'top'],
        'shoulderPivot': [float(1.9 * UNIT), float((4.55 - y_min) * UNIT)],
    }

    blobs = []
    views = []
    accessors = []

    def add(array, target=None, minmax=False):
        raw = array.tobytes()
        pad = (-len(raw)) % 4
        offset = sum(len(b) for b in blobs)
        blobs.append(raw + b'\0' * pad)
        views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(raw), **({'target': target} if target else {})})
        ctype = 5125 if array.dtype == np.uint32 else 5126
        kind = 'SCALAR' if array.ndim == 1 else 'VEC3'
        acc = {'bufferView': len(views) - 1, 'componentType': ctype, 'count': int(array.shape[0]), 'type': kind}
        if minmax:
            acc['min'] = [float(v) for v in array.min(0)]
            acc['max'] = [float(v) for v in array.max(0)]
        accessors.append(acc)
        return len(accessors) - 1

    pos_acc = add(positions, 34962, True)
    idx_acc = add(indices.reshape(-1), 34963)
    target_accs = []
    for k in morphs:
        target_accs.append({'POSITION': add(deltas[k], 34962, True)})

    gltf = {
        'asset': {'version': '2.0', 'generator': 'angaly build-human-base.py'},
        'scene': 0,
        'scenes': [{'nodes': [0]}],
        'nodes': [{'mesh': 0, 'name': 'human'}],
        'meshes': [{
            'name': 'human',
            'primitives': [{'attributes': {'POSITION': pos_acc}, 'indices': idx_acc, 'targets': target_accs}],
            'weights': [0.0] * len(morphs),
            'extras': extras,
        }],
        'accessors': accessors,
        'bufferViews': views,
        'buffers': [{'byteLength': sum(len(b) for b in blobs)}],
    }
    js = json.dumps(gltf, separators=(',', ':')).encode()
    js += b' ' * ((-len(js)) % 4)
    bin_chunk = b''.join(blobs)
    total = 12 + 8 + len(js) + 8 + len(bin_chunk)
    Path(out_path).write_bytes(
        struct.pack('<III', 0x46546C67, 2, total)
        + struct.pack('<II', len(js), 0x4E4F534A) + js
        + struct.pack('<II', len(bin_chunk), 0x004E4942) + bin_chunk
    )
    print(f'{len(positions)} vertices, {len(indices)} triangles, {total/1e6:.2f} MB')
    print('landmarks female', [round(v, 3) for v in extras['landmarksFemale']])
    print('landmarks male  ', [round(v, 3) for v in extras['landmarksMale']])
    print('landmarks f-child', [round(v, 3) for v in extras['landmarksFemaleChild']])
    print('landmarks m-child', [round(v, 3) for v in extras['landmarksMaleChild']])


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
