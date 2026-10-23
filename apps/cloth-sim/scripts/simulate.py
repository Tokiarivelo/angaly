"""Blender driver: lets the draped garment settle on the mannequin and exports it as glTF.

    blender -b -P apps/cloth-sim/scripts/simulate.py -- JOB.json OUT_DIR [--frames 120] [--quality 5]
        [--self-collision] [--preview] [--no-export]

Writes OUT_DIR/garment.glb (Draco, one material per panel, named by panel id), OUT_DIR/metrics.json
and, with --preview, OUT_DIR/before.png / after.png (Cycles, CPU) to compare with the photo.

Coordinates: the job is in three.js space (Y up, front towards +Z); Blender is Z up. Imported as
(x, -z, y); the glTF exporter (+Y up) turns them back into (x, y, z), so the .glb drops into the viewer.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from dataclasses import replace
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cloth_sim.assemble import seam_gaps, surface_area
from cloth_sim.checks import bare_arm, silhouette  # noqa: E402
from cloth_sim.fabric import cloth_params, vertex_mass  # noqa: E402
from cloth_sim.job import Body, Head, Panel, load_job  # noqa: E402
from cloth_sim.layers import layer_crossings, restack  # noqa: E402
from cloth_sim.look import accent_material, panel_material  # noqa: E402
from cloth_sim.petticoat import ABOVE_HEM, HEM_TAPER_INSET, petticoat  # noqa: E402
from cloth_sim.prepare import prepare  # noqa: E402
from cloth_sim.support import SUPPORT_BENDING, support_weights  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_look import (  # noqa: E402
    add_cyclorama,
    eye_material,
    fabric_material,
    hair_material,
    setup_studio,
    skin_material,
)


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(prog="simulate.py")
    ap.add_argument("job")
    ap.add_argument("out")
    ap.add_argument("--frames", type=int, default=80, help="40 to reach the pose (--pose-frames), 40 to settle")
    ap.add_argument("--quality", type=int, default=5)
    ap.add_argument(
        "--self-collision",
        choices=("none", "layers", "all"),
        default="none",
        help="none (default: hidden layers are trimmed instead); layers: where layers overlap (3× slower); "
        "all: whole garment (2.5× slower)",
    )
    ap.add_argument("--raw-layers", action="store_true", help="keep overlapping layers as they are (no trim/gap)")
    ap.add_argument("--no-lift", action="store_true", help="leave cloth that starts under the skin where it is")
    ap.add_argument(
        "--pose-frames", type=int, default=40, help="frames over which the body goes from the dressing pose to the pose"
    )
    ap.add_argument(
        "--support",
        type=float,
        default=SUPPORT_BENDING,
        help="bending stiffness of a puff's supported cloth, × the fabric's (1 = no support)",
    )
    ap.add_argument(
        "--no-petticoat",
        action="store_true",
        help="no petticoat collider under a long skirt (it holds the flare; it starts below the hands)",
    )
    ap.add_argument(
        "--hem-taper",
        type=float,
        default=HEM_TAPER_INSET,
        help="how much further in (m) the petticoat's bottom edge lies, so the hem slides off it (0: hard rim)",
    )
    ap.add_argument(
        "--above-hem", type=float, default=ABOVE_HEM, help="how far (m) above the skirt's hem the petticoat stops"
    )
    ap.add_argument("--petticoat-friction", type=float, default=5.0, help="cloth friction on the petticoat")
    ap.add_argument("--no-floor", action="store_true", help="no floor under the feet (the hem falls through)")
    ap.add_argument("--collision-quality", type=int, default=3)
    ap.add_argument("--body-thickness", type=float, default=0.004, help="body collision outer thickness (m)")
    ap.add_argument(
        "--body-friction",
        type=float,
        default=5.0,
        help="cloth friction on the body: high, the lowering arms drag the sleeves (and the bodice) down with them",
    )
    ap.add_argument("--trace", type=int, default=0, metavar="N", help="save the cloth every N frames (trace_FFF.npy)")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--no-export", action="store_true")
    ap.add_argument("--set", action="append", default=[], metavar="FIELD=VALUE", help="override a ClothParams field")
    return ap.parse_args(argv)


def to_blender(p: np.ndarray) -> np.ndarray:
    return np.stack([p[:, 0], -p[:, 2], p[:, 1]], axis=1)


def make_mesh(name: str, verts: np.ndarray, faces: np.ndarray, edges: np.ndarray | None = None) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts.tolist(), [] if edges is None else edges.tolist(), faces.tolist())
    mesh.validate(clean_customdata=False)
    if len(mesh.polygons) != len(faces) or len(mesh.vertices) != len(verts):
        raise RuntimeError(f"{name}: Blender rejected part of the mesh (clean it before simulating)")
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def penetrations(cloth: np.ndarray, body: BVHTree, margin: float = 0.0) -> int:
    """Cloth vertices under the skin (behind the nearest body face, by more than `margin`)."""
    n = 0
    for co in cloth:
        loc, normal, _, _ = body.find_nearest(Vector(co))
        if loc is not None and (Vector(co) - loc).dot(normal) < -margin:
            n += 1
    return n


def cloth_positions(obj: bpy.types.Object) -> np.ndarray:
    dg = bpy.context.evaluated_depsgraph_get()
    mesh = obj.evaluated_get(dg).data
    out = np.empty(len(mesh.vertices) * 3)
    mesh.vertices.foreach_get("co", out)
    return out.reshape(-1, 3)


def render(scene: bpy.types.Scene, path: Path) -> float:
    t = time.perf_counter()
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    return time.perf_counter() - t


def export_glb(obj: bpy.types.Object, path: Path) -> None:
    """The settled cloth only (no sewing edges), one material per panel, Draco-compressed."""
    dg = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context="EDGES")
    bm.to_mesh(mesh)
    bm.free()
    final = bpy.data.objects.new("garment", mesh)
    bpy.context.scene.collection.objects.link(final)
    for o in bpy.context.scene.objects:
        o.select_set(o == final)
    bpy.context.view_layer.objects.active = final
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_normals=True,
        export_texcoords=True,
    )
    bpy.data.objects.remove(final)


def add_floor(height: float, thickness: float) -> bpy.types.Object:
    """The floor under the feet (Blender z = `height`), collision only: a floor-length hem rests on it."""
    s = 2.0
    obj = make_mesh(
        "floor",
        np.array([[-s, -s, height], [s, -s, height], [s, s, height], [-s, s, height]]),
        np.array([[0, 1, 2, 3]]),
    )
    obj.modifiers.new("collision", "COLLISION")
    obj.collision.thickness_outer = thickness
    obj.collision.cloth_friction = 8.0
    obj.hide_render = True
    return obj


def dress_head(body: bpy.types.Object, head: Head) -> None:
    """The head as the viewer shows it: skin colours on the body, the hair, two eyeballs. Render only."""
    attr = body.data.color_attributes.new("skin", "FLOAT_COLOR", "POINT")
    rgba = np.concatenate([head.skin_colors, np.ones((len(head.skin_colors), 1))], axis=1)
    attr.data.foreach_set("color", rgba.ravel())
    body.data.materials.clear()
    body.data.materials.append(skin_material("skin"))
    if head.hair is not None:
        h = head.hair
        hair = make_mesh("hair", to_blender(h.positions), h.indices)
        uv = hair.data.uv_layers.new(name="UVMap")
        loop_vert = np.empty(len(hair.data.loops), dtype=np.int64)
        hair.data.loops.foreach_get("vertex_index", loop_vert)
        uv.data.foreach_set("uv", h.uvs[loop_vert].ravel())
        for name, values in (("shade", h.shade), ("alpha", h.alpha)):
            a = hair.data.attributes.new(name, "FLOAT", "POINT")
            a.data.foreach_set("value", values.tolist())
        hair.data.materials.append(hair_material(head.hair_color))
    if head.eye_radius > 0:
        mat = eye_material()
        for side in (1.0, -1.0):
            mesh = bpy.data.meshes.new("eye")
            bm = bmesh.new()
            bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=head.eye_radius)
            bm.to_mesh(mesh)
            bm.free()
            mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
            mesh.materials.append(mat)
            eye = bpy.data.objects.new("eye", mesh)
            c = head.eye_centre * np.array([side, 1.0, 1.0])
            eye.location = tuple(to_blender(c[None, :])[0])
            bpy.context.scene.collection.objects.link(eye)


def hand_points(body: Body) -> np.ndarray:
    """The hands, in the dressing pose and in the final one (three.js space): arm skin near the end of each arm."""
    if body.arm_weights is None:
        return np.zeros((0, 3))
    arm = body.arm_weights >= 0.5
    out = []
    for pos in (body.positions, body.final):
        a = pos[arm]
        # The lowest 15 cm of each arm (hands hang below the wrists in these poses).
        for side in (a[:, 0] > 0, a[:, 0] < 0):
            s = a[side]
            if len(s):
                out.append(s[s[:, 1] < s[:, 1].min() + 0.15])
    return np.concatenate(out) if out else np.zeros((0, 3))


def with_positions(panels: list[Panel], offsets: np.ndarray, positions: np.ndarray) -> list[Panel]:
    """The panels with the cloth's positions at some frame (three.js space)."""
    return [replace(p, positions=positions[offsets[i] : offsets[i + 1]], accent=None) for i, p in enumerate(panels)]


def main() -> None:
    args = parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    started = time.perf_counter()

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    job = load_job(args.job)
    prep = prepare(job, layers=not args.raw_layers, lift=not args.no_lift)
    panels, cloth, seams = prep.panels, prep.cloth, prep.seams
    prepare_seconds = time.perf_counter() - started
    params = cloth_params(job.fabric_behavior)
    if args.set:
        params = replace(params, **{k: float(v) for k, v in (kv.split("=", 1) for kv in args.set)})

    body = make_mesh("body", to_blender(job.body.positions), job.body.indices)
    body.modifiers.new("collision", "COLLISION")
    body.collision.thickness_outer = args.body_thickness
    body.collision.thickness_inner = 0.01
    body.collision.cloth_friction = args.body_friction
    faces_body = [tuple(f) for f in job.body.indices.tolist()]
    body_bvh = BVHTree.FromPolygons([tuple(v) for v in to_blender(job.body.positions)], faces_body)
    final_bvh = BVHTree.FromPolygons([tuple(v) for v in to_blender(job.body.final)], faces_body)
    final_body = Body(positions=job.body.final, indices=job.body.indices)
    pose_frames = 0
    if job.body.target is not None:
        # Dressed arms out, then posed: the body moves to the requested pose and the cloth follows it.
        pose_frames = max(2, min(args.pose_frames, args.frames - 1))
        body.shape_key_add(name="dressing")
        key = body.shape_key_add(name="pose")
        key.data.foreach_set("co", to_blender(job.body.target).ravel())
        key.value = 0.0
        key.keyframe_insert("value", frame=1)
        key.value = 1.0
        key.keyframe_insert("value", frame=pose_frames)

    if not args.no_floor:
        add_floor(prep.floor, 0.002)
    under = (
        None
        if args.no_petticoat
        else petticoat(panels, hand_points(job.body), hem_taper=args.hem_taper, above_hem=args.above_hem)
    )
    if under is not None:
        # Collision only: hidden from the render, left out of the export (only the garment is selected).
        coat = make_mesh("petticoat", to_blender(under[0]), under[1])
        coat.modifiers.new("collision", "COLLISION")
        coat.collision.thickness_outer = args.body_thickness
        coat.collision.cloth_friction = args.petticoat_friction
        coat.hide_render = True

    garment = make_mesh("cloth", to_blender(cloth.positions), cloth.faces, seams.pairs)
    mesh = garment.data
    uv = mesh.uv_layers.new(name="UVMap")
    loop_vert = np.empty(len(mesh.loops), dtype=np.int64)
    mesh.loops.foreach_get("vertex_index", loop_vert)
    uv.data.foreach_set("uv", cloth.uvs[loop_vert].ravel())
    # One material per panel (named by its id: the .glb keeps them apart), plus its accent fabric (a sleeve's puff).
    accent_spec = accent_material(job.look)
    face_material = np.empty(len(cloth.faces), dtype=np.int64)
    for i, p in enumerate(panels):
        spec = panel_material(p.zone, job.look, p.motif, p.trim_color)
        mesh.materials.append(fabric_material(p.id, spec))
        in_panel = cloth.face_panel == i
        face_material[in_panel] = len(mesh.materials) - 1
        if accent_spec is not None and p.accent is not None and p.accent.any():
            mesh.materials.append(fabric_material(f"{p.id}:accent", accent_spec))
            local = cloth.faces[in_panel] - cloth.offsets[i]
            on_accent = p.accent[local].sum(axis=1) >= 2
            face_material[np.where(in_panel)[0][on_accent]] = len(mesh.materials) - 1
    mesh.polygons.foreach_set("material_index", face_material.tolist())
    if args.preview:
        if job.head is not None:
            dress_head(body, job.head)
        else:
            body.data.materials.append(skin_material())
        # Smoothed for the picture (after the collider, which keeps the simulated surface).
        smooth_body = body.modifiers.new("smooth", "SUBSURF")
        smooth_body.levels = 0
        smooth_body.render_levels = 1

    if args.self_collision == "layers" and prep.layer_mask.any():
        group = garment.vertex_groups.new(name="layers")
        group.add(np.where(prep.layer_mask)[0].tolist(), 1.0, "REPLACE")

    support = support_weights(panels, job.body)
    if args.support > 1 and support.any():
        group = garment.vertex_groups.new(name="support")
        for w in np.unique(np.round(support[support > 0], 2)):
            group.add(np.where(np.isclose(np.round(support, 2), w))[0].tolist(), float(w), "REPLACE")

    mod = garment.modifiers.new("cloth", "CLOTH")
    s = mod.settings
    s.quality = args.quality
    s.mass = vertex_mass(params, surface_area(cloth.positions, cloth.faces), len(cloth.positions))
    s.air_damping = params.air_damping
    s.tension_stiffness = params.tension
    s.compression_stiffness = params.compression
    s.shear_stiffness = params.shear
    s.bending_stiffness = params.bending
    s.tension_damping = params.tension_damping
    s.compression_damping = params.tension_damping
    s.bending_damping = params.bending_damping
    if args.support > 1 and support.any():
        s.vertex_group_bending = "support"
        s.bending_stiffness_max = params.bending * args.support
    s.use_sewing_springs = True
    s.sewing_force_max = 0.0  # no cap: the seams close
    c = mod.collision_settings
    c.collision_quality = args.collision_quality
    c.distance_min = 0.004
    c.use_self_collision = args.self_collision != "none"
    c.self_distance_min = 0.0025  # below LAYER_GAP: the separated layers do not start in contact
    if args.self_collision == "layers":
        c.vertex_group_self_collisions = "layers"
    mod.point_cache.frame_start = 1
    mod.point_cache.frame_end = args.frames
    scene.frame_start, scene.frame_end = 1, args.frames

    start = prep.start
    metrics: dict[str, object] = {
        "blender": bpy.app.version_string,
        "vertices": int(len(cloth.positions)),
        "triangles": int(len(cloth.faces)),
        "bodyTriangles": int(len(job.body.indices)),
        "seamPairs": int(len(seams.pairs)),
        "tacks": seams.tacks,
        "anchoredParts": seams.anchored,
        "fabric": job.fabric_behavior,
        "params": params.as_dict(),
        "vertexMass": round(s.mass, 4),
        "frames": args.frames,
        "quality": args.quality,
        "poseFrames": pose_frames,
        "support": args.support,
        "petticoatTriangles": 0 if under is None else int(len(under[1])),
        "hemTaper": args.hem_taper,
        "aboveHem": args.above_hem,
        "petticoatFriction": args.petticoat_friction,
        "supportedVertices": int((support > 0.5).sum()),
        "floor": None if args.no_floor else round(prep.floor, 4),
        "collisionQuality": args.collision_quality,
        "bodyThickness": args.body_thickness,
        "bodyFriction": args.body_friction,
        "selfCollision": args.self_collision,
        "layerGroup": int(prep.layer_mask.sum()),
        "trimmedTriangles": prep.trimmed,
        "liftedOutOfSkin": prep.lifted,
        "separatedFromLowerLayer": prep.separated,
        "prepareSeconds": round(prepare_seconds, 1),
        "setupSeconds": round(time.perf_counter() - started, 2),
    }
    gaps0 = seam_gaps(start, seams.pairs)
    metrics["before"] = {
        "seamGapMedianMm": round(float(np.median(gaps0)) * 1000, 1),
        "seamGapMaxMm": round(float(gaps0.max()) * 1000, 1),
        "underSkin": penetrations(to_blender(start), body_bvh, 0.002),
        "layerCrossings": layer_crossings(with_positions(panels, cloth.offsets, start), job.body),
        "silhouette": silhouette(with_positions(panels, cloth.offsets, start), job.body),
    }
    metrics["prepared"] = {
        "underSkin": penetrations(to_blender(cloth.positions), body_bvh, 0.002),
        "layerCrossings": layer_crossings(panels, job.body),
    }
    scene.frame_set(1)
    if args.preview:
        setup_studio(scene)
        add_cyclorama(scene, prep.floor - 0.001)
        metrics["renderBeforeSeconds"] = round(render(scene, out / "before.png"), 1)

    t = time.perf_counter()
    per_frame: list[float] = []
    for f in range(2, args.frames + 1):
        tf = time.perf_counter()
        scene.frame_set(f)
        per_frame.append(time.perf_counter() - tf)
        if args.trace and f % args.trace == 0:
            b = cloth_positions(garment)
            np.save(out / f"trace_{f:03d}.npy", np.stack([b[:, 0], b[:, 2], -b[:, 1]], axis=1))
        if f % 10 == 0:
            print(f"frame {f}/{args.frames}  {per_frame[-1]:.2f}s", flush=True)
    metrics["simSeconds"] = round(time.perf_counter() - t, 1)
    metrics["secondsPerFrame"] = round(float(np.mean(per_frame)), 2)

    settled_b = cloth_positions(garment)
    settled = np.stack([settled_b[:, 0], settled_b[:, 2], -settled_b[:, 1]], axis=1)  # back to three.js space
    if not args.raw_layers:
        # No self-collision during the run: layers that slid through each other are stacked again, and the cloth
        # keeps these positions (the simulation is over: the cloth modifier gives way to the restacked mesh).
        metrics["layerCrossingsSimulated"] = layer_crossings(with_positions(panels, cloth.offsets, settled), final_body)
        settled, metrics["restacked"] = restack(panels, cloth.offsets, settled, final_body)
        garment.modifiers.remove(mod)
        garment.data.vertices.foreach_set("co", to_blender(settled).ravel())
        garment.data.update()
        settled_b = cloth_positions(garment)
    gaps = seam_gaps(settled, seams.pairs)
    np.save(out / "settled.npy", settled)
    moved = np.linalg.norm(settled - start, axis=1)
    metrics["after"] = {
        "seamGapMedianMm": round(float(np.median(gaps)) * 1000, 1),
        "seamGapP95Mm": round(float(np.percentile(gaps, 95)) * 1000, 1),
        "seamGapMaxMm": round(float(gaps.max()) * 1000, 1),
        "underSkin": penetrations(settled_b, final_bvh, 0.002),
        "layerCrossings": layer_crossings(with_positions(panels, cloth.offsets, settled), final_body),
        "bareArm": bare_arm(panels, with_positions(panels, cloth.offsets, settled), job.body),
        "movedMedianMm": round(float(np.median(moved)) * 1000, 1),
        "movedMaxMm": round(float(moved.max()) * 1000, 1),
        "hemDropMm": round(float((start[:, 1].min() - settled[:, 1].min()) * 1000), 1),
        "underFloor": int((settled[:, 1] < prep.floor - 0.002).sum()),
        "finite": bool(np.isfinite(settled).all()),
        "silhouette": silhouette(
            with_positions(panels, cloth.offsets, settled),
            Body(positions=job.body.final, indices=job.body.indices, arm_weights=job.body.arm_weights),
        ),
    }
    if not args.no_export:
        te = time.perf_counter()
        export_glb(garment, out / "garment.glb")
        metrics["exportSeconds"] = round(time.perf_counter() - te, 1)
        metrics["glbBytes"] = (out / "garment.glb").stat().st_size
    if args.preview:
        # Smoothed for the picture only (the .glb keeps the simulated mesh): one subdivision over the settled cloth.
        smooth = garment.modifiers.new("smooth", "SUBSURF")
        smooth.levels = 0
        smooth.render_levels = 1
        metrics["renderAfterSeconds"] = round(render(scene, out / "after.png"), 1)
    metrics["totalSeconds"] = round(time.perf_counter() - started, 1)
    (out / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
