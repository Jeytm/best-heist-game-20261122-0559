// Wall cameras — fixed eyes that sweep their cone across the room on their own rhythm.
// A camera's cone is red and reads as danger from across the room. Looping a camera (the
// F tool) freezes its sweep and turns its cone grey and harmless until the loop runs out.
import { CAMERA } from './config.js';
import { CAMERA_MOUNTS, solidRects } from './level.js';
import { hasLineOfSight, pointInCone } from './sight.js';

export function makeCameras() {
  return CAMERA_MOUNTS.map((mount) => ({
    name: mount.name,
    x: mount.x,
    y: mount.y,
    baseAngle: mount.baseAngle,
    sweep: mount.sweep,
    // Each camera sweeps on its own phase so the cones never line up neatly.
    phase: mount.x * 0.013 + mount.y * 0.007,
    loopLeft: 0,
  }));
}

/** Where a camera is looking right now: a slow sine sweep around its mount angle. */
export function cameraFacing(camera, time) {
  if (camera.loopLeft > 0) return camera.baseAngle;
  return camera.baseAngle + Math.sin((time / CAMERA.sweepSeconds) * Math.PI * 2 + camera.phase) * camera.sweep;
}

export function updateCameras(cameras, dt) {
  for (const camera of cameras) {
    if (camera.loopLeft > 0) camera.loopLeft -= dt;
  }
}

/** Does this camera see the thief right now? A looped camera sees nothing. */
export function cameraSeesThief(camera, thief, time) {
  if (camera.loopLeft > 0) return false;
  const facing = cameraFacing(camera, time);
  if (!pointInCone(camera, facing, CAMERA.coneRange, CAMERA.coneHalfAngle, thief)) return false;
  return hasLineOfSight(camera, thief, solidRects());
}

/** The nearest camera to a point, within `maxDist` — the one the loop tool freezes. */
export function nearestCamera(cameras, point, maxDist) {
  let best = null;
  let bestDist = maxDist;
  for (const camera of cameras) {
    const d = Math.hypot(camera.x - point.x, camera.y - point.y);
    if (d < bestDist) {
      bestDist = d;
      best = camera;
    }
  }
  return best;
}
