'use client';

import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { PanelMeshData } from '../utils/garment3d/garment-model';
import { anchorOnTriangle, neighbourAnchors, type Falloff, type SculptAnchor, type Vec3 } from '../utils/garment3d/sculpt';

/** What the viewer needs to let the user model the pattern on the garment (see usePatternSculpt). */
export interface SculptViewProps {
  radiusMm: number;
  falloff: Falloff;
  /** The brush also reaches the other pieces under it. */
  propagate: boolean;
  /** A drag starts on the fabric; false ⇒ refused (nothing editable there). */
  onStart: (anchors: SculptAnchor[]) => boolean;
  /** World displacement (m) of the point held since the drag started; at most once per frame. */
  onMove: (world: Vec3) => void;
  onEnd: () => void;
  /** The piece grabbed (selected in the 2D views). */
  onPick?: ((pieceId: string) => void) | undefined;
}

export interface SculptHandlers {
  hover: (event: ThreeEvent<PointerEvent>, panel: PanelMeshData) => void;
  leave: () => void;
  down: (event: ThreeEvent<PointerEvent>, panel: PanelMeshData) => void;
}

const EDITABLE_COLOR = new THREE.Color('#E0B45C');
const LOCKED_COLOR = new THREE.Color('#7F8794');
const Z_AXIS = new THREE.Vector3(0, 0, 1);

/** The point held on a panel, in the panel's own frame (its group moves when the assembly is exploded). */
const localHit = (event: ThreeEvent<PointerEvent>): { at: Vec3; face: [number, number, number] } | null => {
  if (!event.face) return null;
  const p = event.object.worldToLocal(event.point.clone());
  return { at: [p.x, p.y, p.z], face: [event.face.a, event.face.b, event.face.c] };
};

/**
 * Brush ring under the cursor and the drag itself: the point held moves in the plane facing the camera, and the
 * displacement is handed to `onMove` once per animation frame (a fast mouse never queues several drapes).
 */
export const SculptBrush = React.forwardRef<
  SculptHandlers,
  { sculpt: SculptViewProps; panels: PanelMeshData[]; onDraggingChange: (dragging: boolean) => void }
>(({ sculpt, panels, onDraggingChange }, ref) => {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const ring = useRef<THREE.Mesh>(null);
  const latest = useRef({ sculpt, panels, onDraggingChange });
  latest.current = { sculpt, panels, onDraggingChange };
  const drag = useRef<{ cleanup: () => void } | null>(null);

  const place = (at: THREE.Vector3, normal: THREE.Vector3, editable: boolean): void => {
    const mesh = ring.current;
    if (!mesh) return;
    const r = latest.current.sculpt.radiusMm / 1000;
    mesh.visible = true;
    mesh.position.copy(at).addScaledVector(normal, 0.004);
    mesh.quaternion.setFromUnitVectors(Z_AXIS, normal);
    mesh.scale.setScalar(r);
    (mesh.material as THREE.MeshBasicMaterial).color.copy(editable ? EDITABLE_COLOR : LOCKED_COLOR);
    invalidate();
  };

  const towards = (): Vec3 => {
    const d = camera.getWorldDirection(new THREE.Vector3());
    return [-d.x, -d.y, -d.z];
  };

  useImperativeHandle(ref, () => ({
    hover: (event, panel) => {
      if (drag.current) return;
      event.stopPropagation();
      const hit = localHit(event);
      if (!hit) return;
      const anchor = anchorOnTriangle(panel, hit.face, hit.at, towards());
      const normal = anchor
        ? new THREE.Vector3(...anchor.normal)
        : camera.getWorldDirection(new THREE.Vector3()).negate();
      place(event.point, normal, anchor !== null);
    },
    leave: () => {
      if (drag.current || !ring.current) return;
      ring.current.visible = false;
      invalidate();
    },
    down: (event, panel) => {
      if (event.button !== 0 || drag.current) return;
      const hit = localHit(event);
      if (!hit) return;
      const { sculpt: s, panels: all } = latest.current;
      const anchor = anchorOnTriangle(panel, hit.face, hit.at, towards());
      if (!anchor) return;
      const anchors = s.propagate ? [anchor, ...neighbourAnchors(all, anchor, hit.at, s.radiusMm, s.falloff)] : [anchor];
      if (!s.onStart(anchors)) return;
      event.stopPropagation();
      s.onPick?.(anchor.pieceId);

      const start = event.point.clone();
      const normal = new THREE.Vector3(...anchor.normal);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), start);
      const raycaster = new THREE.Raycaster();
      const target = new THREE.Vector3();
      let pending: Vec3 | null = null;
      let frame: number | null = null;
      const flush = (): void => {
        frame = null;
        if (pending) latest.current.sculpt.onMove(pending);
        pending = null;
      };
      const onMove = (e: PointerEvent): void => {
        const rect = gl.domElement.getBoundingClientRect();
        const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        if (!raycaster.ray.intersectPlane(plane, target)) return;
        pending = [target.x - start.x, target.y - start.y, target.z - start.z];
        place(target, normal, true);
        frame ??= requestAnimationFrame(flush);
      };
      const finish = (): void => {
        if (frame !== null) cancelAnimationFrame(frame);
        flush();
        cleanup();
        latest.current.sculpt.onEnd();
      };
      const cleanup = (): void => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);
        drag.current = null;
        latest.current.onDraggingChange(false);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
      drag.current = { cleanup };
      latest.current.onDraggingChange(true);
      place(start, normal, true);
    },
  }));

  // A drag in progress when the viewer goes away (tab switched) is ended cleanly.
  useEffect(
    () => () => {
      if (!drag.current) return;
      drag.current.cleanup();
      latest.current.sculpt.onEnd();
    },
    [],
  );

  // A unit ring scaled to the brush radius, over a faint disc: the area the stroke reaches, readable at any zoom.
  return (
    <mesh ref={ring} visible={false} renderOrder={10}>
      <ringGeometry args={[0.85, 1, 64]} />
      <meshBasicMaterial color={EDITABLE_COLOR} transparent opacity={0.95} depthTest={false} side={THREE.DoubleSide} />
      {/* Dark edge: the ring reads on a light fabric as well as on a dark one. */}
      <mesh renderOrder={10}>
        <ringGeometry args={[1, 1.07, 64]} />
        <meshBasicMaterial color="#041329" transparent opacity={0.8} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh renderOrder={9}>
        <circleGeometry args={[0.85, 64]} />
        <meshBasicMaterial color="#F6E7C1" transparent opacity={0.14} depthTest={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </mesh>
  );
});
SculptBrush.displayName = 'SculptBrush';
