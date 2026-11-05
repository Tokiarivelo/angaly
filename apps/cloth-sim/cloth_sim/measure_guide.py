"""Where each body measurement is taken, drawn on the mannequin: the tape's path for the measurement guide images.

A girth is a slice of the body by a plane (horizontal for the torso and the legs, across the arm for the arm) and the
tape follows its convex hull, as a tape measure bridges the hollows. A length follows the skin (centre back, centre
front, the side, the outside of the arm) or, for a height, runs straight down to the floor. The landmarks (neck, bust,
waist, hip, crotch, shoulder tip, wrist…) are found on the mesh itself, in the job's three.js space (metres, Y up,
front towards +Z). Pure numpy: `scripts/render_measure_guide.py` turns the paths into gold tubes and renders them.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .job import Body

TAPE_LIFT = 0.004
"""The tape lies this far (m) off the skin, so the drawing is never inside it."""
SLAB = 0.004
"""Half-thickness (m) of the slab of vertices read at one height (profiles, landmarks)."""
CROTCH_UNDER_HIP = 0.09
"""Lowest crotch (m, reference stature) under the hip line."""
REFERENCE_HEIGHT = 1.68
"""Stature (m) the anthropometric fractions below are written for."""


@dataclass(frozen=True)
class Path:
    points: np.ndarray  # (n, 3)
    closed: bool


@dataclass(frozen=True)
class Guide:
    key: str
    paths: list[Path]
    view: str
    """Camera: FRONT, BACK or SIDE (the left side, +x)."""


@dataclass(frozen=True)
class Landmarks:
    height: float
    neck_y: float
    neck_base_y: float
    high_bust_y: float
    bust_y: float
    underbust_y: float
    waist_y: float
    belly_y: float
    hip_y: float
    crotch_y: float
    thigh_y: float
    knee_y: float
    ankle_y: float
    bust_x: float
    shoulder_tip: np.ndarray
    neck_side: np.ndarray
    armpit_y: float
    wrist: np.ndarray
    elbow: np.ndarray
    arm_axis: np.ndarray


def triangles(body: Body, keep: np.ndarray) -> np.ndarray:
    """(t, 3, 3) corners of the body triangles whose three vertices are kept."""
    faces = body.indices[keep[body.indices].all(axis=1)]
    return body.positions[faces]


def slice_points(tris: np.ndarray, origin: np.ndarray, normal: np.ndarray) -> np.ndarray:
    """Points where the triangles' edges cross the plane (origin, normal): the outline of the cut, densely sampled."""
    d = (tris - origin) @ normal
    out = []
    for a, b in ((0, 1), (1, 2), (2, 0)):
        da, db = d[:, a], d[:, b]
        cross = (da * db) < 0
        if cross.any():
            t = (da[cross] / (da[cross] - db[cross]))[:, None]
            out.append(tris[cross, a] + t * (tris[cross, b] - tris[cross, a]))
    return np.concatenate(out) if out else np.zeros((0, 3))


def _basis(normal: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    n = normal / np.linalg.norm(normal)
    helper = np.array([0.0, 0.0, 1.0]) if abs(n[2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    u = np.cross(n, helper)
    u /= np.linalg.norm(u)
    return u, np.cross(n, u)


def convex_hull_2d(points: np.ndarray) -> np.ndarray:
    """Indices of the convex hull of 2D points, counter-clockwise (Andrew's monotone chain)."""
    order = np.lexsort((points[:, 1], points[:, 0]))

    def half(idx: np.ndarray) -> list[int]:
        chain: list[int] = []
        for i in idx:
            while len(chain) >= 2:
                o, a = points[chain[-2]], points[chain[-1]]
                b = points[i]
                if (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]) > 0:
                    break
                chain.pop()
            chain.append(int(i))
        return chain

    lower = half(order)
    upper = half(order[::-1])
    return np.array(lower[:-1] + upper[:-1])


def girth(points: np.ndarray, normal: np.ndarray, lift: float = TAPE_LIFT) -> Path:
    """The tape round a slice: convex hull of its points in their plane, lifted off the skin."""
    u, v = _basis(normal)
    centre = points.mean(axis=0)
    flat = np.stack([(points - centre) @ u, (points - centre) @ v], axis=1)
    hull = flat[convex_hull_2d(flat)]
    r = np.linalg.norm(hull, axis=1, keepdims=True)
    hull = hull * (r + lift) / np.maximum(r, 1e-9)
    # Even spacing (~5 mm) so the tube is round everywhere.
    closed = np.concatenate([hull, hull[:1]])
    seg = np.linalg.norm(np.diff(closed, axis=0), axis=1)
    s = np.concatenate([[0.0], np.cumsum(seg)])
    t = np.linspace(0, s[-1], max(16, int(s[-1] / 0.005)), endpoint=False)
    xy = np.stack([np.interp(t, s, closed[:, 0]), np.interp(t, s, closed[:, 1])], axis=1)
    return Path(points=centre + xy[:, :1] * u + xy[:, 1:] * v, closed=True)


def perimeter(path: Path) -> float:
    p = np.concatenate([path.points, path.points[:1]]) if path.closed else path.points
    return float(np.linalg.norm(np.diff(p, axis=0), axis=1).sum())


def _horizontal(tris: np.ndarray, y: float, select: np.ndarray | None = None) -> np.ndarray:
    pts = slice_points(tris, np.array([0.0, y, 0.0]), np.array([0.0, 1.0, 0.0]))
    return pts if select is None else pts[select(pts)]


def _girth_at(tris: np.ndarray, y: float, select=None) -> Path | None:  # noqa: ANN001
    pts = _horizontal(tris, y, select)
    return girth(pts, np.array([0.0, 1.0, 0.0])) if len(pts) >= 3 else None


def _extreme_y(tris: np.ndarray, lo: float, hi: float, score, best=max) -> float:  # noqa: ANN001
    """Height in [lo, hi] (1 mm steps) where score(slice points) is best."""
    ys = np.arange(lo, hi, 0.002)
    values = []
    for y in ys:
        pts = _horizontal(tris, float(y))
        values.append(score(pts) if len(pts) >= 3 else (-np.inf if best is max else np.inf))
    arr = np.array(values)
    return float(ys[int(np.argmax(arr) if best is max else np.argmin(arr))])


def _hull_length(pts: np.ndarray) -> float:
    return perimeter(girth(pts, np.array([0.0, 1.0, 0.0]), lift=0.0))


def find_landmarks(body: Body) -> Landmarks:
    pos = body.positions
    arm_w = body.arm_weights if body.arm_weights is not None else np.zeros(len(pos))
    torso = triangles(body, arm_w < 0.5)
    h = float(pos[:, 1].max() - pos[:, 1].min())
    s = h / REFERENCE_HEIGHT
    floor = float(pos[:, 1].min())

    def at(fraction: float) -> float:
        return floor + fraction * h

    neck_y = _extreme_y(torso, at(0.83), at(0.88), _hull_length, best=min)
    base = neck_y
    narrow = _hull_length(_horizontal(torso, neck_y))
    # The base of the neck: down from its narrowest until it widens into the shoulders.
    while base > at(0.78) and _hull_length(_horizontal(torso, base - 0.002)) < 1.18 * narrow:
        base -= 0.002
    bust_y = _extreme_y(torso, at(0.66), at(0.78), lambda p: float(p[:, 2].max()))
    waist_y = _extreme_y(torso, at(0.56), at(0.66), _hull_length, best=min)
    hip_y = _extreme_y(torso, at(0.46), waist_y - 0.08 * s, lambda p: float(np.ptp(p[:, 0])))
    # The crotch: the highest height under the hip where nothing crosses the body's middle (two legs); thighs that
    # touch hide it, so never lower than an average rise under the hip.
    crotch_y = hip_y
    while crotch_y > hip_y - CROTCH_UNDER_HIP * s:
        pts = _horizontal(torso, crotch_y)
        if len(pts) and np.abs(pts[:, 0]).min() > 0.01:
            break
        crotch_y -= 0.002
    front = _horizontal(torso, bust_y)
    front = front[front[:, 0] > 0]
    bust_x = float(front[np.argmax(front[:, 2]), 0]) if len(front) else 0.09 * s
    # Arm (left, +x): the shoulder tip is the top of the arm–torso boundary; the hand's end gives the arm's direction.
    side = pos[:, 0] > 0
    armpit = side & (arm_w > 0.4) & (arm_w < 0.6)
    armpit_y = float(pos[armpit, 1].min()) if armpit.any() else bust_y + 0.05 * s
    # The shoulder tip (acromion): the outermost point of the shoulder's top, over the arm's root.
    top = side & (arm_w < 0.7) & (pos[:, 1] > armpit_y + 0.06 * s) & (pos[:, 1] < base)
    tip = pos[top][np.argmax(pos[top, 0] + 0.6 * pos[top, 1])] if top.any() else np.array([0.19 * s, 0.82 * h, 0])
    arm = pos[side & (arm_w >= 0.5)]
    finger = arm[np.argmin(arm[:, 1])] if len(arm) else tip - np.array([0, 0.7 * s, 0])
    axis = (finger - tip) / np.linalg.norm(finger - tip)
    reach = float(np.dot(finger - tip, axis))
    neck_ring = _horizontal(torso, base)
    neck_side = neck_ring[np.argmax(neck_ring[:, 0])] if len(neck_ring) else np.array([0.06 * s, base, 0])
    return Landmarks(
        height=h,
        neck_y=neck_y,
        neck_base_y=base,
        high_bust_y=max(bust_y + 0.06 * s, min(armpit_y - 0.01 * s, bust_y + 0.1 * s)),
        bust_y=bust_y,
        underbust_y=bust_y - 0.08 * s,
        waist_y=waist_y,
        belly_y=waist_y - 0.09 * s,
        hip_y=hip_y,
        crotch_y=crotch_y,
        thigh_y=crotch_y - 0.04 * s,
        knee_y=at(0.285),
        ankle_y=at(0.05),
        bust_x=bust_x,
        shoulder_tip=tip,
        neck_side=neck_side,
        armpit_y=armpit_y,
        # Fingertip reach = arm + hand; the hand is ~23 % of it, the elbow ~43 % down.
        wrist=tip + axis * reach * 0.77,
        elbow=tip + axis * reach * 0.43,
        arm_axis=axis,
    )


def _profile(
    tris: np.ndarray,
    ys: np.ndarray,
    pick,
    lift: float = TAPE_LIFT,
    outward: np.ndarray | None = None,  # noqa: ANN001
) -> Path:
    """A line on the skin through one point per height (`pick(slice points) -> point`), lifted `outward`."""
    pts = []
    for y in ys:
        sl = _horizontal(tris, float(y))
        p = pick(sl) if len(sl) else None
        if p is not None:
            pts.append(p)
    arr = smooth(np.array(pts))
    if outward is not None:
        arr = arr + outward * lift
    return Path(points=arr, closed=False)


def smooth(points: np.ndarray, window: int = 7) -> np.ndarray:
    """Moving average along a line (ends kept): a tape lies straight over the spine's groove, it does not zigzag."""
    if len(points) <= window:
        return points
    k = window // 2
    padded = np.concatenate([np.repeat(points[:1], k, axis=0), points, np.repeat(points[-1:], k, axis=0)])
    kernel = np.ones(window) / window
    out = np.stack([np.convolve(padded[:, c], kernel, mode="valid") for c in range(3)], axis=1)
    out[0], out[-1] = points[0], points[-1]
    return out


def _near_x(x0: float, use_max_z: bool):  # noqa: ANN202
    def pick(sl: np.ndarray) -> np.ndarray | None:
        near = sl[np.abs(sl[:, 0] - x0) < 0.012]
        if not len(near):
            return None
        return near[np.argmax(near[:, 2])] if use_max_z else near[np.argmin(near[:, 2])]

    return pick


def _outer_side(sl: np.ndarray) -> np.ndarray | None:
    side = sl[sl[:, 0] > 0]
    return side[np.argmax(side[:, 0])] if len(side) else None


def _across(tris: np.ndarray, y: float, half: float, front: bool) -> Path:
    """A line across the front or back at height y, between ±`half`."""
    sl = _horizontal(tris, y)
    xs = np.linspace(-half, half, 40)
    pts = []
    for x in xs:
        near = sl[np.abs(sl[:, 0] - x) < 0.01]
        if len(near):
            pts.append(near[np.argmax(near[:, 2])] if front else near[np.argmin(near[:, 2])])
    arr = np.array(pts) + np.array([0.0, 0.0, TAPE_LIFT if front else -TAPE_LIFT])
    return Path(points=arr, closed=False)


def _straight(a: np.ndarray, b: np.ndarray, n: int = 30) -> Path:
    return Path(points=np.linspace(a, b, n), closed=False)


def guides(body: Body) -> list[Guide]:
    """The tape's path for each measurement of the catalogue (`MEASUREMENT_CATALOG` keys), with its camera."""
    lm = find_landmarks(body)
    pos = body.positions
    arm_w = body.arm_weights if body.arm_weights is not None else np.zeros(len(pos))
    s = lm.height / REFERENCE_HEIGHT
    torso = triangles(body, arm_w < 0.5)
    arm = triangles(body, (arm_w >= 0.5) & (pos[:, 0] > 0))
    floor = float(pos[:, 1].min())
    out: list[Guide] = []

    def ring(key: str, y: float, view: str = "FRONT", select=None) -> None:  # noqa: ANN001
        g = _girth_at(torso, y, select)
        if g is not None:
            out.append(Guide(key, [g], view))

    left_leg = lambda p: p[:, 0] > 0.005  # noqa: E731
    ring("TOUR_POITRINE", lm.bust_y)
    ring("TOUR_HAUT_POITRINE", lm.high_bust_y, select=lambda p: np.abs(p[:, 0]) < np.abs(lm.shoulder_tip[0]) - 0.02)
    ring("TOUR_SOUS_POITRINE", lm.underbust_y)
    ring("TOUR_TAILLE", lm.waist_y)
    ring("TOUR_BASSIN", lm.hip_y)
    ring("TOUR_HANCHE_COMPLET", lm.belly_y + 0.5 * (lm.hip_y - lm.belly_y), view="SIDE")
    ring("TOUR_COU", lm.neck_base_y)
    ring("TOUR_CUISSE", lm.thigh_y, select=left_leg)
    ring("TOUR_GENOU", lm.knee_y, select=left_leg)
    ring("TOUR_CHEVILLE", lm.ankle_y, select=left_leg)

    def arm_ring(key: str, centre: np.ndarray, radius: float) -> None:
        pts = slice_points(arm, centre, lm.arm_axis)
        pts = pts[np.linalg.norm(pts - centre, axis=1) < radius]
        if len(pts) >= 3:
            out.append(Guide(key, [girth(pts, lm.arm_axis)], "FRONT"))

    tip = lm.shoulder_tip
    arm_ring("TOUR_BRAS", tip + (lm.elbow - tip) * 0.45, 0.09 * s)
    arm_ring("TOUR_POIGNET", lm.wrist, 0.05 * s)
    # The armhole: round the arm's root, through the shoulder tip and the armpit.
    root = tip + lm.arm_axis * 0.02 * s
    pts = slice_points(triangles(body, pos[:, 0] > 0), root, lm.arm_axis)
    pts = pts[np.linalg.norm(pts - root, axis=1) < 0.14 * s]
    if len(pts) >= 3:
        out.append(Guide("TOUR_EMMANCHURE", [girth(pts, lm.arm_axis)], "SIDE"))

    up = np.array([0.0, 1.0, 0.0])
    fwd = np.array([0.0, 0.0, 1.0])
    out.append(
        Guide(
            "LONGUEUR_DOS",
            [_profile(torso, np.linspace(lm.neck_base_y, lm.waist_y, 40), _near_x(0, False), outward=-fwd)],
            "BACK",
        )
    )
    out.append(
        Guide(
            "LONGUEUR_DEVANT",
            [_profile(torso, np.linspace(lm.neck_base_y - 0.02 * s, lm.waist_y, 40), _near_x(0, True), outward=fwd)],
            "FRONT",
        )
    )
    # Bust height: from the neck's side down to the bust point.
    xs = np.linspace(lm.neck_side[0], lm.bust_x, 40)
    ys = np.linspace(lm.neck_side[1], lm.bust_y, 40)
    pts = []
    for x, y in zip(xs, ys, strict=True):
        p = _near_x(float(x), True)(_horizontal(torso, float(y)))
        if p is not None:
            pts.append(p + fwd * TAPE_LIFT)
    if pts:
        out.append(Guide("HAUTEUR_POITRINE", [Path(np.array(pts), False)], "FRONT"))
    bp = _horizontal(torso, lm.bust_y)
    apex = [bp[(np.sign(bp[:, 0]) == sgn)][np.argmax(bp[(np.sign(bp[:, 0]) == sgn), 2])] for sgn in (1, -1)]
    out.append(Guide("ECARTEMENT_POINTS_POITRINE", [_straight(apex[0] + fwd * 0.01, apex[1] + fwd * 0.01)], "FRONT"))
    # Across the back (front) between the arm creases, a little over the armpits.
    across_y = lm.armpit_y + 0.05 * s
    half = float(np.abs(_horizontal(torso, across_y)[:, 0]).max()) - 0.012 * s
    out.append(Guide("CARRURE_DOS", [_across(torso, across_y, half, front=False)], "BACK"))
    out.append(Guide("CARRURE_DEVANT", [_across(torso, across_y, half - 0.01 * s, front=True)], "FRONT"))
    out.append(Guide("LARGEUR_EPAULE", [_straight(lm.neck_side + up * 0.006, tip + up * 0.008)], "FRONT"))
    # Shoulder slope: a ruler laid flat from the neck base over the shoulder, then the drop to the shoulder tip.
    ruler_end = np.array([tip[0], lm.neck_side[1], tip[2]]) + up * 0.006
    out.append(
        Guide(
            "PENTE_EPAULE",
            [_straight(lm.neck_side + up * 0.006, ruler_end), _straight(ruler_end, tip + up * 0.008)],
            "FRONT",
        )
    )
    # Armhole depth: from the shoulder line down to the armpit, drawn just in front of the arm's root.
    out.append(
        Guide(
            "PROFONDEUR_EMMANCHURE",
            [
                _straight(
                    np.array([tip[0] - 0.015 * s, tip[1], tip[2] + 0.08 * s]),
                    np.array([tip[0] - 0.015 * s, lm.armpit_y, tip[2] + 0.08 * s]),
                )
            ],
            "FRONT",
        )
    )
    # Down the outside of the arm, from the shoulder tip to the wrist bone.
    lateral = np.array([1.0, 0.0, 0.0]) - lm.arm_axis * lm.arm_axis[0]
    lateral /= np.linalg.norm(lateral)
    reach = float(np.dot(lm.wrist - tip, lm.arm_axis))
    along = []
    for t in np.linspace(0.06, 1.0, 30):
        c = tip + lm.arm_axis * reach * t
        ring_pts = slice_points(arm, c, lm.arm_axis)
        ring_pts = ring_pts[np.linalg.norm(ring_pts - c, axis=1) < 0.08 * s]
        if len(ring_pts):
            along.append(ring_pts[np.argmax(ring_pts @ lateral)] + lateral * TAPE_LIFT)
    if along:
        out.append(Guide("LONGUEUR_BRAS", [Path(smooth(np.array([tip + up * 0.008, *along])), False)], "FRONT"))
    side = np.array([1.0, 0.0, 0.0])
    out.append(
        Guide(
            "HAUTEUR_BASSIN",
            [_profile(torso, np.linspace(lm.waist_y, lm.hip_y, 30), _outer_side, outward=side)],
            "SIDE",
        )
    )
    out.append(
        Guide(
            "HAUTEUR_TAILLE_GENOU",
            [_profile(torso, np.linspace(lm.waist_y, lm.knee_y, 50), _outer_side, outward=side)],
            "SIDE",
        )
    )
    skirt_end = lm.knee_y - 0.12 * s
    out.append(
        Guide(
            "LONGUEUR_JUPE",
            [_profile(torso, np.linspace(lm.waist_y, skirt_end, 50), _outer_side, outward=side)],
            "SIDE",
        )
    )
    out.append(
        Guide(
            "LONGUEUR_JAMBE",
            [_profile(torso, np.linspace(lm.waist_y, floor + 0.01, 70), _outer_side, outward=side)],
            "SIDE",
        )
    )
    # Rise: waist to crotch level, drawn down the side of the hip (the crotch itself is hidden between the legs).
    hip_side = float(np.abs(_horizontal(torso, lm.hip_y)[:, 0]).max()) + TAPE_LIFT
    out.append(
        Guide(
            "HAUTEUR_FOURCHE",
            [_straight(np.array([hip_side, lm.waist_y, 0.0]), np.array([hip_side, lm.crotch_y, 0.0]))],
            "FRONT",
        )
    )
    # Crotch length: centre front waist, down between the legs, up to the centre back waist (seen from the side,
    # where the tape follows the body's front and back outline).
    low = lm.crotch_y + 0.015 * s
    front = _profile(torso, np.linspace(lm.waist_y, low, 40), _near_x(0, True), outward=fwd)
    back = _profile(torso, np.linspace(lm.waist_y, low, 40), _near_x(0, False), outward=-fwd)
    bottom = np.array([0.0, lm.crotch_y - TAPE_LIFT, (front.points[-1][2] + back.points[-1][2]) / 2])
    out.append(
        Guide(
            "LONGUEUR_ENFOURCHURE",
            [front, _straight(front.points[-1], bottom), _straight(bottom, back.points[-1]), back],
            "SIDE",
        )
    )
    inner = np.array([0.012, 0.0, 0.03])
    out.append(
        Guide(
            "HAUTEUR_ENTREJAMBE",
            [_straight(np.array([0.0, lm.crotch_y, 0.0]) + inner, np.array([0.0, floor + 0.01, 0.0]) + inner)],
            "FRONT",
        )
    )
    centre = pos[:, [0, 2]].mean(axis=0)
    front_z = float(pos[pos[:, 1] < lm.hip_y, 2].max()) + 0.04 * s
    out.append(
        Guide(
            "HAUTEUR_TAILLE_SOL",
            [_straight(np.array([centre[0], lm.waist_y, front_z]), np.array([centre[0], floor + 0.002, front_z]))],
            "SIDE",
        )
    )
    heel = float(pos[pos[:, 1] < floor + 0.05, 2].min())
    out.append(
        Guide(
            "LONGUEUR_TRAINE",
            [_straight(np.array([0.0, floor + 0.004, heel]), np.array([0.0, floor + 0.004, heel - 0.6 * s]))],
            "SIDE",
        )
    )
    out.append(
        Guide(
            "STATURE",
            [_straight(np.array([0.0, floor, -0.12 * s]), np.array([0.0, floor + lm.height, -0.12 * s]))],
            "SIDE",
        )
    )
    return out


LEOTARD = (0.035, 0.045, 0.075)
"""Linear RGB of the leotard the mannequin wears in the guide pictures (a dark navy)."""


def leotard_colors(body: Body, skin: np.ndarray) -> np.ndarray:
    """Per-vertex colours: the skin, with a leotard over the torso from the top of the bust to the crotch."""
    lm = find_landmarks(body)
    pos = body.positions
    arm_w = body.arm_weights if body.arm_weights is not None else np.zeros(len(pos))
    s = lm.height / REFERENCE_HEIGHT
    top = lm.high_bust_y + 0.02 * s
    covered = (arm_w < 0.5) & (pos[:, 1] < top) & (pos[:, 1] > lm.crotch_y - 0.03 * s)
    out = skin.copy()
    out[covered] = LEOTARD
    return out
