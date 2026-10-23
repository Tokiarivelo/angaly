'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PanelMeshData } from '../utils/garment3d/garment-model';
import type { PointInstance } from '../utils/garment3d/mesh-edit';
import { anchorOnTriangle, type Vec3 } from '../utils/garment3d/sculpt';
import type { ModalState, TransformInput } from '../hooks/useMeshEdit';

/** What the viewer needs for the edit mode (see useMeshEdit). */
export interface MeshEditViewProps {
  instances: PointInstance[];
  selection: ReadonlyMap<string, string | null>;
  modal: ModalState | null;
  /** X-ray: points behind the garment are shown and selectable. */
  xray: boolean;
  /** Proportional editing on: the mouse wheel sets its radius during a transform. */
  proportional: boolean;
  onSelect: (key: string | null, panelId: string | null, extend: boolean) => void;
  onBoxSelect: (entries: Array<{ key: string; panelId: string }>, extend: boolean) => void;
  /** Ctrl + click on the fabric: a point on the nearest seam (false: nothing near). */
  onInsert: (pieceId: string, flat: { x: number; y: number }, panelId: string) => boolean;
  onTransform: (input: TransformInput) => void;
  onConfirm: () => void;
  onCancel: () => void;
  /** Wheel during a proportional transform: radius × factor. */
  onRadiusScale: (factor: number) => void;
}

export interface ScreenBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const PICK_PX = 14;
const DRAG_PX = 5;
const SELECTED = new THREE.Color('#FFA436');
const IDLE = new THREE.Color('#F6F2E9');

/** A round point with a dark rim: readable on light and dark fabric alike. */
const dotTexture = (): THREE.Texture | null => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#041329';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(16, 16, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

/** Points of the pattern on the garment, selection (click, box), Ctrl + click insertion and modal transforms. */
export const MeshEditLayer: React.FC<{ edit: MeshEditViewProps; panels: PanelMeshData[]; onBoxChange: (box: ScreenBox | null) => void }> = ({
  edit,
  onBoxChange,
}) => {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const latest = useRef({ edit, onBoxChange });
  latest.current = { edit, onBoxChange };
  const texture = useMemo(dotTexture, []);
  const modalStart = useRef<{ x: number; y: number; hit: THREE.Vector3 | null } | null>(null);
  useEffect(() => () => texture?.dispose(), [texture]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(edit.instances.length * 3);
    const colors = new Float32Array(edit.instances.length * 3);
    edit.instances.forEach((p, i) => {
      // A few millimetres off the cloth, so the point is not buried in it.
      for (let k = 0; k < 3; k += 1) positions[i * 3 + k] = p.position[k]! + p.normal[k]! * 0.006;
      (edit.selection.has(p.key) ? SELECTED : IDLE).toArray(colors, i * 3);
    });
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [edit.instances, edit.selection]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => invalidate(), [geometry, edit.xray, invalidate]);

  useEffect(() => {
    const dom = gl.domElement;
    const rectOf = (): DOMRect => dom.getBoundingClientRect();
    const toScreen = (p: Vec3): { x: number; y: number; z: number } => {
      const v = new THREE.Vector3(...p).project(camera);
      const r = rectOf();
      return { x: ((v.x + 1) / 2) * r.width + r.left, y: ((1 - v.y) / 2) * r.height + r.top, z: v.z };
    };
    const toCamera = (): Vec3 => {
      const d = camera.getWorldDirection(new THREE.Vector3());
      return [-d.x, -d.y, -d.z];
    };
    // Seen from the camera (not on the far side of the garment), unless X-ray is on.
    const visible = (p: PointInstance): boolean => {
      if (latest.current.edit.xray) return true;
      const c = camera.position;
      return (c.x - p.position[0]) * p.normal[0] + (c.y - p.position[1]) * p.normal[1] + (c.z - p.position[2]) * p.normal[2] > 0;
    };

    // ---- Modal transform (G / S / R): follows the mouse until a click confirms or Escape / right click cancels.
    let frame: number | null = null;
    let pending: TransformInput | null = null;
    const pivot = (): Vec3 | null => {
      const { instances, selection } = latest.current.edit;
      const chosen = instances.filter((i) => selection.has(i.key) && (selection.get(i.key) === null || selection.get(i.key) === i.panelId));
      if (chosen.length === 0) return null;
      const sum = chosen.reduce<Vec3>((a, i) => [a[0] + i.position[0], a[1] + i.position[1], a[2] + i.position[2]], [0, 0, 0]);
      return [sum[0] / chosen.length, sum[1] / chosen.length, sum[2] / chosen.length];
    };
    const flush = (): void => {
      frame = null;
      if (pending) latest.current.edit.onTransform(pending);
      pending = null;
    };
    const onModalMove = (e: PointerEvent): void => {
      const modal = latest.current.edit.modal;
      if (!modal) return;
      const centre = pivot();
      if (!centre) return;
      const r = rectOf();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), new THREE.Vector3(...centre));
      const hit = ray.ray.intersectPlane(plane, new THREE.Vector3());
      if (!modalStart.current) {
        modalStart.current = { x: e.clientX, y: e.clientY, hit: hit?.clone() ?? null };
        return;
      }
      const start = modalStart.current;
      const c = toScreen(centre);
      const input: TransformInput = { toCamera: toCamera() };
      if (modal.kind === 'grab' && hit && start.hit) input.world = [hit.x - start.hit.x, hit.y - start.hit.y, hit.z - start.hit.z];
      if (modal.kind === 'scale') {
        const d0 = Math.hypot(start.x - c.x, start.y - c.y);
        input.factor = d0 > 1 ? Math.hypot(e.clientX - c.x, e.clientY - c.y) / d0 : 1;
      }
      if (modal.kind === 'rotate') {
        // Screen y points down: counter-clockwise on screen is the negated atan2 difference.
        input.angle = -(Math.atan2(e.clientY - c.y, e.clientX - c.x) - Math.atan2(start.y - c.y, start.x - c.x));
      }
      pending = input;
      frame ??= requestAnimationFrame(flush);
    };

    // ---- Selection: click picks the nearest point, a drag draws a box; Ctrl + click inserts a point.
    const pick = (x: number, y: number): PointInstance | null => {
      let best: PointInstance | null = null;
      let bestD = PICK_PX;
      let bestZ = Infinity;
      for (const p of latest.current.edit.instances) {
        if (!visible(p)) continue;
        const s = toScreen(p.position);
        const d = Math.hypot(s.x - x, s.y - y);
        if (d < bestD - 1 || (d <= bestD + 1 && s.z < bestZ)) {
          best = p;
          bestD = Math.min(bestD, d);
          bestZ = s.z;
        }
      }
      return best;
    };
    const insertAt = (x: number, y: number): void => {
      const r = rectOf();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), camera);
      const meshes: THREE.Object3D[] = [];
      scene.traverse((o) => {
        if ((o.userData as { panel?: PanelMeshData }).panel) meshes.push(o);
      });
      for (const hit of ray.intersectObjects(meshes, false)) {
        const panel = (hit.object.userData as { panel: PanelMeshData }).panel;
        if (!hit.face) continue;
        const local = hit.object.worldToLocal(hit.point.clone());
        const anchor = anchorOnTriangle(panel, [hit.face.a, hit.face.b, hit.face.c], [local.x, local.y, local.z], toCamera());
        if (anchor && latest.current.edit.onInsert(anchor.pieceId, anchor.flat, panel.id)) return;
        break;
      }
    };

    const onPointerDown = (e: PointerEvent): void => {
      const { modal } = latest.current.edit;
      if (modal) {
        e.preventDefault();
        e.stopPropagation();
        if (e.button === 0) latest.current.edit.onConfirm();
        else latest.current.edit.onCancel();
        return;
      }
      if (e.button !== 0 || e.altKey) return;
      const start = { x: e.clientX, y: e.clientY };
      let box: ScreenBox | null = null;
      const onMove = (m: PointerEvent): void => {
        if (!box && Math.hypot(m.clientX - start.x, m.clientY - start.y) < DRAG_PX) return;
        const r = rectOf();
        box = {
          left: Math.min(start.x, m.clientX) - r.left,
          top: Math.min(start.y, m.clientY) - r.top,
          width: Math.abs(m.clientX - start.x),
          height: Math.abs(m.clientY - start.y),
        };
        latest.current.onBoxChange(box);
      };
      const onUp = (u: PointerEvent): void => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        const extend = u.shiftKey || u.ctrlKey || u.metaKey;
        if (box) {
          const r = rectOf();
          const b = box;
          const inside = latest.current.edit.instances.filter((p) => {
            if (!visible(p)) return false;
            const s = toScreen(p.position);
            const x = s.x - r.left;
            const y = s.y - r.top;
            return x >= b.left && x <= b.left + b.width && y >= b.top && y <= b.top + b.height;
          });
          latest.current.edit.onBoxSelect(
            inside.map((p) => ({ key: p.key, panelId: p.panelId })),
            u.shiftKey,
          );
          latest.current.onBoxChange(null);
          return;
        }
        if (u.ctrlKey || u.metaKey) {
          insertAt(u.clientX, u.clientY);
          return;
        }
        const hit = pick(u.clientX, u.clientY);
        latest.current.edit.onSelect(hit?.key ?? null, hit?.panelId ?? null, extend);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };
    const onContextMenu = (e: MouseEvent): void => {
      if (latest.current.edit.modal) e.preventDefault();
    };
    const onWheel = (e: WheelEvent): void => {
      const { modal, proportional } = latest.current.edit;
      if (!modal || !proportional) return;
      // Blender: the wheel sets the proportional radius during a transform (not the zoom).
      e.preventDefault();
      e.stopPropagation();
      latest.current.edit.onRadiusScale(e.deltaY < 0 ? 1.15 : 1 / 1.15);
    };
    dom.addEventListener('pointerdown', onPointerDown, { capture: true });
    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('wheel', onWheel, { capture: true, passive: false });
    window.addEventListener('pointermove', onModalMove);
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown, { capture: true });
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('pointermove', onModalMove);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [camera, gl, scene]);

  // A new transform measures the mouse from its next position.
  const inModal = edit.modal !== null;
  useEffect(() => {
    modalStart.current = null;
  }, [inModal]);

  return (
    <points geometry={geometry} renderOrder={12}>
      <pointsMaterial
        size={11}
        sizeAttenuation={false}
        vertexColors
        map={texture}
        alphaTest={0.5}
        transparent
        depthTest={!edit.xray}
        depthWrite={false}
      />
    </points>
  );
};
