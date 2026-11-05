"""Blender: one picture per body measurement — the mannequin, the tape's path in gold (`cloth_sim/measure_guide.py`).

    blender -b -P apps/cloth-sim/scripts/render_measure_guide.py -- JOB.json OUT_DIR [--size 480] [--only KEY,KEY]

The job is any cloth-sim job (`tools/export-job.ts`): only its body (dressing pose: arms a little out, so the arm and
armhole measurements are visible) and its head are used. Writes OUT_DIR/<KEY>.webp (transparent background, for the
wizard's dark cards) and OUT_DIR/index.json (key → view). The pictures are ours (CC0 MakeHuman body), no photo.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import time
from dataclasses import replace
from pathlib import Path

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from render_look import _rgba, skin_material  # noqa: E402
from simulate import dress_head, make_mesh, to_blender  # noqa: E402

from cloth_sim.job import load_job  # noqa: E402
from cloth_sim.measure_guide import Guide, guides, leotard_colors  # noqa: E402

GOLD = "#e0c48a"
TAPE_RADIUS = 0.005
VIEWS = {
    # Where the camera stands, seen from the subject (Blender axes: the body faces -Y); SIDE: 3/4 from the front-left.
    "FRONT": (0.0, -1.0, 0.0),
    "BACK": (0.0, 1.0, 0.0),
    "SIDE": (0.75, -0.66, 0.0),
}
MIN_FRAME = 0.75
"""Smallest framed height (m): a wrist or the neck is shown with the forearm or the head around it."""


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(prog="render_measure_guide.py")
    ap.add_argument("job")
    ap.add_argument("out")
    ap.add_argument("--size", type=int, default=480, help="picture width (px); height is 1.5×")
    ap.add_argument("--samples", type=int, default=48)
    ap.add_argument("--only", default="", help="comma-separated measurement keys")
    return ap.parse_args(argv)


def tape(guide: Guide, material: bpy.types.Material) -> list[bpy.types.Object]:
    objs = []
    for k, path in enumerate(guide.paths):
        curve = bpy.data.curves.new(f"{guide.key}-{k}", "CURVE")
        curve.dimensions = "3D"
        curve.bevel_depth = TAPE_RADIUS
        curve.bevel_resolution = 3
        curve.use_fill_caps = True
        spline = curve.splines.new("POLY")
        pts = to_blender(path.points)
        spline.points.add(len(pts) - 1)
        spline.points.foreach_set("co", np.concatenate([pts, np.ones((len(pts), 1))], axis=1).ravel())
        spline.use_cyclic_u = path.closed
        curve.materials.append(material)
        obj = bpy.data.objects.new(curve.name, curve)
        bpy.context.scene.collection.objects.link(obj)
        objs.append(obj)
        if not path.closed:
            # End marks: the tape starts and stops there.
            for end in (pts[0], pts[-1]):
                bpy.ops.mesh.primitive_uv_sphere_add(
                    radius=TAPE_RADIUS * 2.2, location=tuple(end), segments=16, ring_count=8
                )
                dot = bpy.context.active_object
                dot.data.materials.append(material)
                objs.append(dot)
    return objs


def gold_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("tape")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = _rgba(GOLD)
    bsdf.inputs["Emission Color"].default_value = _rgba(GOLD)
    bsdf.inputs["Emission Strength"].default_value = 0.6
    bsdf.inputs["Metallic"].default_value = 0.6
    bsdf.inputs["Roughness"].default_value = 0.3
    return mat


def frame(cam: bpy.types.Object, guide: Guide, body_bounds: tuple[np.ndarray, np.ndarray]) -> None:
    """Orthographic camera on the path, with the body around it."""
    pts = to_blender(np.concatenate([p.points for p in guide.paths]))
    lo, hi = pts.min(axis=0), pts.max(axis=0)
    centre = (lo + hi) / 2
    extent = float(max(hi[2] - lo[2], (hi[0] - lo[0]) * 1.5, (hi[1] - lo[1]) * 1.5))
    full = float(body_bounds[1][2] - body_bounds[0][2])
    height = min(full * 1.08, max(MIN_FRAME, extent * 1.6))
    if height > full * 0.8:
        height = full * 1.08
        centre = (body_bounds[0] + body_bounds[1]) / 2
    d = np.array(VIEWS[guide.view])
    cam.location = tuple(centre + d * 5.0)
    # Looking back along -d: a camera turned by θ about Z looks along (-sin θ, cos θ, 0).
    cam.rotation_euler = (math.pi / 2, 0.0, math.atan2(d[0], -d[1]))
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = height  # height is the long side (portrait)


def main() -> None:
    args = parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    started = time.perf_counter()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    job = load_job(args.job)
    body = make_mesh("body", to_blender(job.body.positions), job.body.indices)
    if job.head is not None:
        # A dark leotard over the torso: decent, and the gold tape stands out on it.
        dress_head(body, replace(job.head, skin_colors=leotard_colors(job.body, job.head.skin_colors)))
    else:
        body.data.materials.append(skin_material())
    smooth = body.modifiers.new("smooth", "SUBSURF")
    smooth.levels = smooth.render_levels = 1

    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = args.samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 4
    scene.render.film_transparent = True
    scene.render.resolution_x = args.size
    scene.render.resolution_y = int(args.size * 1.5)
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.quality = 85
    scene.view_settings.view_transform = "AgX"
    world = bpy.data.worlds.new("studio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.5, 0.52, 0.58, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
    scene.world = world
    for name, loc, power in (
        ("key", (2.0, -3.0, 2.6), 1500),
        ("fill", (-2.5, -2.0, 1.6), 700),
        ("back", (0, 3.0, 2.4), 700),
    ):
        light = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
        light.data.size = 3.0
        light.data.energy = power
        light.location = loc
        d = np.array([0.0, 0.0, 1.0]) - np.array(loc)
        light.rotation_euler = (math.atan2(math.hypot(d[0], d[1]), -d[2]), 0.0, math.atan2(d[1], d[0]) + math.pi / 2)
        scene.collection.objects.link(light)
    cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
    scene.collection.objects.link(cam)
    scene.camera = cam

    pts = to_blender(job.body.positions)
    bounds = (pts.min(axis=0), pts.max(axis=0))
    gold = gold_material()
    only = {k for k in args.only.split(",") if k}
    index: dict[str, str] = {}
    rendered = 0
    for guide in guides(job.body):
        if only and guide.key not in only:
            continue
        objs = tape(guide, gold)
        frame(cam, guide, bounds)
        scene.render.filepath = str(out / f"{guide.key}.webp")
        bpy.ops.render.render(write_still=True)
        for o in objs:
            bpy.data.objects.remove(o)
        index[guide.key] = guide.view
        rendered += 1
        print(f"{guide.key} ({guide.view})", flush=True)
    index_file = out / "index.json"
    if only and index_file.exists():  # --only re-renders a few pictures: keep the others' entries
        index = {**json.loads(index_file.read_text()), **index}
    index_file.write_text(json.dumps(index, indent=2))
    print(f"{rendered} pictures in {time.perf_counter() - started:.0f}s")


if __name__ == "__main__":
    main()
