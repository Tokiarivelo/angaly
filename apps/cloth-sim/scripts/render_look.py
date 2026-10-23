"""Blender side of the render: the photo's fabric as node materials, and a studio to see it in (Cycles).

A `MaterialSpec` (cloth_sim/look.py) becomes a Principled BSDF: velvet (sheen, deep matte ground), satin (low
roughness, a soft sheen) or matt cloth, its print drawn procedurally on the flat-fabric UVs (metres), one repeat
every `tile_m`. Gold motifs (brocade, arabesques) are a little metallic. The head as the viewer shows it: skin colours,
hair, eyeballs. The studio: four soft area lights over a grey sweep (floor and backdrop in one, so the figure stands
and casts a shadow), AgX colour management and the denoiser.
"""

from __future__ import annotations

import math

import bpy

from cloth_sim.look import MaterialSpec, srgb_to_linear
from cloth_sim.motifs import (
    EMBROIDERY_SIZE,
    EMBROIDERY_TILE_M,
    SMOCK_SIZE,
    SMOCK_TILE_M,
    embroidery_pixels,
    smocking_heights,
    to_blender_pixels,
)

SKIN = "#d6b49a"


def _set(node: bpy.types.Node, name: str, value: object) -> None:
    """Sets a node input when this Blender version has it (input names moved between 3.x and 4.x)."""
    if name in node.inputs:
        node.inputs[name].default_value = value


def _rgba(hex_color: str) -> tuple[float, float, float, float]:
    return (*srgb_to_linear(hex_color), 1.0)


def _gold_like(hex_color: str) -> bool:
    r, g, b = (int(hex_color[k : k + 2], 16) for k in (1, 3, 5))
    return r > 150 and g > 110 and b < 120 and r > b + 50


def _print_mask(nt: bpy.types.NodeTree, spec: MaterialSpec) -> bpy.types.NodeSocket | None:
    """A 0…1 mask of the motif on the flat fabric (UVs in metres), one repeat every `spec.tile_m`."""
    if spec.print == "UNI":
        return None
    nodes, links = nt.nodes, nt.links
    uv = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    scale = 1.0 / max(spec.tile_m, 1e-3)
    mapping.inputs["Scale"].default_value = (scale, scale, scale)
    links.new(uv.outputs["UV"], mapping.inputs["Vector"])
    vec = mapping.outputs["Vector"]
    ramp = nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements

    def band(lo: float, hi: float, invert: bool = False) -> None:
        els[0].position, els[1].position = lo, hi
        els[0].color, els[1].color = ((1, 1, 1, 1), (0, 0, 0, 1)) if invert else ((0, 0, 0, 1), (1, 1, 1, 1))

    if spec.print in ("POIS", "FLEURI"):
        vor = nodes.new("ShaderNodeTexVoronoi")
        vor.inputs["Scale"].default_value = 1.0
        _set(vor, "Randomness", 0.0 if spec.print == "POIS" else 0.55)
        links.new(vec, vor.inputs["Vector"])
        radius = 0.15 if spec.print == "POIS" else 0.2
        band(radius * 0.92, radius, invert=True)
        if spec.print == "FLEURI":
            # Petals: the round dot broken by a radial wave.
            noise = nodes.new("ShaderNodeTexNoise")
            noise.inputs["Scale"].default_value = 6.0
            links.new(vec, noise.inputs["Vector"])
            add = nodes.new("ShaderNodeMath")
            add.operation = "MULTIPLY_ADD"
            add.inputs[1].default_value = 0.12
            links.new(noise.outputs["Fac"], add.inputs[0])
            links.new(vor.outputs["Distance"], add.inputs[2])
            links.new(add.outputs["Value"], ramp.inputs["Fac"])
        else:
            links.new(vor.outputs["Distance"], ramp.inputs["Fac"])
    elif spec.print in ("ARABESQUE", "BROCART"):
        # Arabesques: thin curving gold stems — the edges of Voronoi cells in a space bent by noise, so they wave and
        # curl instead of running straight. Brocade: the same vines, closer, with blossoms strewn over them.
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 1.4
        noise.inputs["Detail"].default_value = 3.0
        links.new(vec, noise.inputs["Vector"])
        centred = nodes.new("ShaderNodeVectorMath")
        centred.operation = "SUBTRACT"
        centred.inputs[1].default_value = (0.5, 0.5, 0.5)
        links.new(noise.outputs["Color"], centred.inputs[0])
        bent = nodes.new("ShaderNodeVectorMath")
        bent.operation = "MULTIPLY_ADD"
        bent.inputs[1].default_value = (0.9, 0.9, 0.9)
        links.new(centred.outputs["Vector"], bent.inputs[0])
        links.new(vec, bent.inputs[2])
        edges = nodes.new("ShaderNodeTexVoronoi")
        edges.feature = "DISTANCE_TO_EDGE"
        edges.inputs["Scale"].default_value = 1.2 if spec.print == "ARABESQUE" else 2.0
        links.new(bent.outputs["Vector"], edges.inputs["Vector"])
        line = nodes.new("ShaderNodeValToRGB")
        lels = line.color_ramp.elements
        lels[0].position, lels[0].color = 0.0, (1, 1, 1, 1)
        lels[1].position, lels[1].color = 0.035, (0, 0, 0, 1)
        links.new(edges.outputs["Distance"], line.inputs["Fac"])
        if spec.print == "ARABESQUE":
            return line.outputs["Color"]
        vor = nodes.new("ShaderNodeTexVoronoi")
        vor.inputs["Scale"].default_value = 1.6
        _set(vor, "Randomness", 0.7)
        links.new(vec, vor.inputs["Vector"])
        band(0.24, 0.28, invert=True)
        links.new(vor.outputs["Distance"], ramp.inputs["Fac"])
        both = nodes.new("ShaderNodeMixRGB")
        both.blend_type = "LIGHTEN"
        both.inputs["Fac"].default_value = 1.0
        links.new(line.outputs["Color"], both.inputs["Color1"])
        links.new(ramp.outputs["Color"], both.inputs["Color2"])
        return both.outputs["Color"]
    else:
        # Stripes, checks and other prints: sharp bands (checks: two crossed bands).
        wave = nodes.new("ShaderNodeTexWave")
        wave.wave_type = "BANDS"
        wave.bands_direction = "X" if spec.print != "AUTRE" else "DIAGONAL"
        wave.inputs["Scale"].default_value = 1.0
        links.new(vec, wave.inputs["Vector"])
        band(0.45, 0.55)
        links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    return ramp.outputs["Color"]


def _motif_image(name: str, size: int, pixels: object) -> bpy.types.Image:
    """A motif tile as a packed image (built once per render, shared by every panel that uses it)."""
    image = bpy.data.images.get(name)
    if image is None:
        image = bpy.data.images.new(name, size, size, alpha=True)
        image.colorspace_settings.name = "Non-Color"
        image.pixels.foreach_set(to_blender_pixels(pixels))
        image.pack()
    return image


def _tiled_image(nt: bpy.types.NodeTree, image: bpy.types.Image, tile_m: float) -> bpy.types.Node:
    """An image node repeating every `tile_m` of the flat fabric (UVs in metres)."""
    nodes, links = nt.nodes, nt.links
    uv = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    scale = 1.0 / tile_m
    mapping.inputs["Scale"].default_value = (scale, scale, scale)
    links.new(uv.outputs["UV"], mapping.inputs["Vector"])
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.extension = "REPEAT"
    tex.interpolation = "Cubic"
    links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
    return tex


def _bump(
    nt: bpy.types.NodeTree, height: bpy.types.NodeSocket, strength: float, distance: float
) -> bpy.types.NodeSocket:
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = distance
    nt.links.new(height, bump.inputs["Height"])
    return bump.outputs["Normal"]


def _detail(nt: bpy.types.NodeTree, spec: MaterialSpec, base: bpy.types.NodeSocket, bsdf: bpy.types.Node) -> None:
    """The motif of a detail area over its fabric: embroidery = the thread (satin shading × its colour) laid over the
    cloth where it covers it, slightly raised; smocking = the honeycomb's relief, darker in the folds."""
    nodes, links = nt.nodes, nt.links
    if spec.detail == "BRODERIE":
        tex = _tiled_image(nt, _motif_image("angaly-broderie", EMBROIDERY_SIZE, embroidery_pixels()), EMBROIDERY_TILE_M)
        thread = nodes.new("ShaderNodeMixRGB")
        thread.blend_type = "MULTIPLY"
        thread.inputs["Fac"].default_value = 1.0
        thread.inputs["Color1"].default_value = _rgba(spec.thread)
        links.new(tex.outputs["Color"], thread.inputs["Color2"])
        over = nodes.new("ShaderNodeMixRGB")
        links.new(tex.outputs["Alpha"], over.inputs["Fac"])
        links.new(base, over.inputs["Color1"])
        links.new(thread.outputs["Color"], over.inputs["Color2"])
        links.new(over.outputs["Color"], bsdf.inputs["Base Color"])
        links.new(_bump(nt, tex.outputs["Alpha"], 0.3, 0.0006), bsdf.inputs["Normal"])
        if _gold_like(spec.thread):
            links.new(tex.outputs["Alpha"], bsdf.inputs["Metallic"])
    elif spec.detail == "SMOCKS":
        tex = _tiled_image(nt, _motif_image("angaly-smocks", SMOCK_SIZE, smocking_heights()), SMOCK_TILE_M)
        shade = nodes.new("ShaderNodeMath")
        shade.operation = "MULTIPLY_ADD"
        shade.inputs[1].default_value = 0.35
        shade.inputs[2].default_value = 0.65
        links.new(tex.outputs["Color"], shade.inputs[0])
        folds = nodes.new("ShaderNodeMixRGB")
        folds.blend_type = "MULTIPLY"
        folds.inputs["Fac"].default_value = 1.0
        links.new(base, folds.inputs["Color1"])
        links.new(shade.outputs["Value"], folds.inputs["Color2"])
        links.new(folds.outputs["Color"], bsdf.inputs["Base Color"])
        links.new(_bump(nt, tex.outputs["Color"], 0.3, 0.0012), bsdf.inputs["Normal"])


def fabric_material(name: str, spec: MaterialSpec) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    ground = _rgba(spec.color)
    motif = _rgba(spec.motif)
    mask = _print_mask(nt, spec)
    if mask is not None:
        mix = nt.nodes.new("ShaderNodeMixRGB")
        mix.inputs["Color1"].default_value = ground
        mix.inputs["Color2"].default_value = motif
        nt.links.new(mask, mix.inputs["Fac"])
        nt.links.new(mix.outputs["Color"], bsdf.inputs["Base Color"])
        if _gold_like(spec.motif):
            # Gold thread: the motif shines a little.
            metal = nt.nodes.new("ShaderNodeMath")
            metal.operation = "MULTIPLY"
            metal.inputs[1].default_value = 0.7
            nt.links.new(mask, metal.inputs[0])
            nt.links.new(metal.outputs["Value"], bsdf.inputs["Metallic"])
    else:
        bsdf.inputs["Base Color"].default_value = ground
    if spec.detail:
        if mask is not None:
            base = mix.outputs["Color"]
        else:
            rgb = nt.nodes.new("ShaderNodeRGB")
            rgb.outputs["Color"].default_value = ground
            base = rgb.outputs["Color"]
        _detail(nt, spec, base, bsdf)
    if spec.finish == "VELOURS":
        # Velvet: matte, deep ground and a bright sheen at grazing angles (the pile catching the light).
        _set(bsdf, "Roughness", 0.9)
        _set(bsdf, "Sheen Weight", 0.55)
        _set(bsdf, "Sheen Roughness", 0.3)
        _set(bsdf, "Sheen Tint", (0.45, 0.5, 0.8, 1.0))
        _set(bsdf, "Specular IOR Level", 0.15)
    elif spec.finish == "SATIN":
        _set(bsdf, "Roughness", 0.28)
        _set(bsdf, "Sheen Weight", 0.3)
        _set(bsdf, "Specular IOR Level", 0.6)
        _set(bsdf, "Anisotropic", 0.4)
    else:
        _set(bsdf, "Roughness", 0.75)
        _set(bsdf, "Sheen Weight", 0.25)
        _set(bsdf, "Specular IOR Level", 0.35)
    return mat


def skin_material(color_attribute: str | None = None) -> bpy.types.Material:
    """Skin: one tone, or the body's per-vertex colours (`color_attribute`: lips, blush, brows, lash line)."""
    mat = bpy.data.materials.new("skin")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    if color_attribute:
        attr = nt.nodes.new("ShaderNodeAttribute")
        attr.attribute_name = color_attribute
        nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = _rgba(SKIN)
    _set(bsdf, "Roughness", 0.55)
    _set(bsdf, "Specular IOR Level", 0.35)
    _set(bsdf, "Subsurface Weight", 0.2)
    _set(bsdf, "Subsurface Radius", (0.012, 0.005, 0.003))
    _set(bsdf, "Subsurface Scale", 0.4)
    _set(bsdf, "Sheen Weight", 0.15)
    _set(bsdf, "Sheen Tint", (0.91, 0.66, 0.54, 1.0))
    return mat


def hair_material(color: str) -> bpy.types.Material:
    """Hair as the viewer draws it: the colour × each vertex's light factor (`shade`: roots and the underside of the
    locks darker), fine strands along the locks, cut where the coverage (`alpha`) is under ½ (the scalp's edge)."""
    mat = bpy.data.materials.new("hair")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = nodes["Principled BSDF"]
    shade = nodes.new("ShaderNodeAttribute")
    shade.attribute_name = "shade"
    alpha = nodes.new("ShaderNodeAttribute")
    alpha.attribute_name = "alpha"
    # Strands: thin bands across the lock (u), a little uneven.
    uv = nodes.new("ShaderNodeTexCoord")
    strands = nodes.new("ShaderNodeTexWave")
    strands.wave_type = "BANDS"
    strands.bands_direction = "X"
    strands.inputs["Scale"].default_value = 18.0
    strands.inputs["Distortion"].default_value = 3.0
    links.new(uv.outputs["UV"], strands.inputs["Vector"])
    fibre = nodes.new("ShaderNodeMapRange")
    fibre.inputs["To Min"].default_value = 0.75
    fibre.inputs["To Max"].default_value = 1.1
    links.new(strands.outputs["Fac"], fibre.inputs["Value"])
    light = nodes.new("ShaderNodeMath")
    light.operation = "MULTIPLY"
    links.new(shade.outputs["Fac"], light.inputs[0])
    links.new(fibre.outputs["Result"], light.inputs[1])
    tint = nodes.new("ShaderNodeMixRGB")
    tint.blend_type = "MULTIPLY"
    tint.inputs["Fac"].default_value = 1.0
    tint.inputs["Color1"].default_value = _rgba(color)
    links.new(light.outputs["Value"], tint.inputs["Color2"])
    links.new(tint.outputs["Color"], bsdf.inputs["Base Color"])
    cut = nodes.new("ShaderNodeMath")
    cut.operation = "GREATER_THAN"
    cut.inputs[1].default_value = 0.5
    links.new(alpha.outputs["Fac"], cut.inputs[0])
    links.new(cut.outputs["Value"], bsdf.inputs["Alpha"])
    _set(bsdf, "Roughness", 0.45)
    _set(bsdf, "Specular IOR Level", 0.5)
    _set(bsdf, "Anisotropic", 0.6)
    return mat


def eye_material(iris: str = "#8a6440") -> bpy.types.Material:
    """An eyeball looking forward (−Y in Blender): white, the iris, the pupil, under a glossy cornea."""
    mat = bpy.data.materials.new("eye")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = nodes["Principled BSDF"]
    coord = nodes.new("ShaderNodeTexCoord")
    unit = nodes.new("ShaderNodeVectorMath")
    unit.operation = "NORMALIZE"
    links.new(coord.outputs["Object"], unit.inputs[0])
    xyz = nodes.new("ShaderNodeSeparateXYZ")
    links.new(unit.outputs["Vector"], xyz.inputs[0])
    forward = nodes.new("ShaderNodeMath")
    forward.operation = "MULTIPLY"
    forward.inputs[1].default_value = -1.0
    links.new(xyz.outputs["Y"], forward.inputs[0])
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "EASE"
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.84, (0.78, 0.75, 0.72, 1.0)
    els[1].position, els[1].color = 0.86, _rgba(iris)
    els.new(0.95).color = (*[0.6 * c for c in _rgba(iris)[:3]], 1.0)
    els.new(0.96).color = (0.01, 0.01, 0.01, 1.0)
    links.new(forward.outputs["Value"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    _set(bsdf, "Roughness", 0.3)
    _set(bsdf, "Coat Weight", 1.0)
    _set(bsdf, "Coat Roughness", 0.03)
    return mat


def add_cyclorama(scene: bpy.types.Scene, floor: float, color: str = "#5f6268") -> bpy.types.Object:
    """A studio sweep: the floor the figure stands on curving up into the backdrop (no horizon line), matte."""
    # Far enough behind the figure that no light's back plane cuts across it (a sharp terminator on the wall).
    wall_y, radius, height, half = 5.0, 2.5, 9.0, 10.0
    profile = [(-8.0, floor)]
    for k in range(13):
        a = (math.pi / 2) * k / 12
        profile.append((wall_y - radius + radius * math.sin(a), floor + radius * (1 - math.cos(a))))
    profile.append((wall_y, floor + height))
    verts = [(x, y, z) for x in (-half, half) for y, z in profile]
    n = len(profile)
    faces = [(k, k + 1, n + k + 1, n + k) for k in range(n - 1)]
    mesh = bpy.data.meshes.new("cyclorama")
    mesh.from_pydata(verts, [], faces)
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    obj = bpy.data.objects.new("cyclorama", mesh)
    scene.collection.objects.link(obj)
    mat = bpy.data.materials.new("cyclorama")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = _rgba(color)
    _set(bsdf, "Roughness", 1.0)
    _set(bsdf, "Specular IOR Level", 0.1)
    mesh.materials.append(mat)
    return obj


def _area(scene: bpy.types.Scene, name: str, loc: tuple[float, float, float], size: float, power: float) -> None:
    light = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
    light.data.size = size
    light.data.energy = power
    light.location = loc
    # Aimed at the middle of the figure.
    target = (0.0, 0.0, 1.0)
    d = [target[k] - loc[k] for k in range(3)]
    light.rotation_euler = (math.atan2(math.hypot(d[0], d[1]), -d[2]), 0.0, math.atan2(d[1], d[0]) + math.pi / 2)
    scene.collection.objects.link(light)


def setup_studio(scene: bpy.types.Scene, width: int = 900, height: int = 1350, samples: int = 96) -> None:
    """Cycles (CPU), four soft lights, a plain backdrop, AgX, denoised."""
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.adaptive_threshold = 0.02
    # Fewer bounces than the default 12: cloth, skin and a matte studio converge long before.
    scene.cycles.max_bounces = 6
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 3
    scene.cycles.transmission_bounces = 4
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.film_transparent = False
    if "AgX" in [t.identifier for t in scene.view_settings.bl_rna.properties["view_transform"].enum_items]:
        scene.view_settings.view_transform = "AgX"
    world = bpy.data.worlds.new("studio")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = _rgba("#8a8c92")
    bg.inputs["Strength"].default_value = 0.8
    scene.world = world
    cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
    cam.data.lens = 70
    cam.location = (0.55, -4.6, 1.0)
    cam.rotation_euler = (math.radians(89), 0, math.radians(6.8))
    scene.collection.objects.link(cam)
    scene.camera = cam
    _area(scene, "key", (1.8, -2.4, 2.6), 2.0, 1500)
    _area(scene, "fill", (-2.2, -2.2, 1.6), 3.0, 500)
    _area(scene, "rim", (-0.8, 2.4, 2.4), 1.5, 1200)
    _area(scene, "top", (0.0, -0.6, 3.6), 2.0, 400)
