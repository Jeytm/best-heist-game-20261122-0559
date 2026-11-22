// Sight and touch: the geometry every watcher and the thief share — whether a cone can
// see a point, whether a wall blocks the view, and whether a circle can stand somewhere.

/** Smallest signed angle from `from` to `to`, in (-PI, PI]. */
export function angleDiff(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/** Is `point` inside a vision cone (origin, facing angle, range, half-angle)? */
export function pointInCone(origin, facing, range, halfAngle, point) {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  return Math.abs(angleDiff(facing, Math.atan2(dy, dx))) <= halfAngle;
}

/** Does the segment a→b cross the axis-aligned rect? (Liang–Barsky slab test.) */
export function segmentHitsRect(a, b, rect) {
  let tMin = 0;
  let tMax = 1;
  for (const [d, min, max, origin] of [
    [b.x - a.x, rect.x, rect.x + rect.width, a.x],
    [b.y - a.y, rect.y, rect.y + rect.height, a.y],
  ]) {
    if (d === 0) {
      if (origin < min || origin > max) return false;
      continue;
    }
    let t1 = (min - origin) / d;
    let t2 = (max - origin) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

/** True when no solid rect stands between `a` and `b`. */
export function hasLineOfSight(a, b, solids) {
  for (const rect of solids) {
    if (segmentHitsRect(a, b, rect)) return false;
  }
  return true;
}

/** Can a circle of `radius` centred at (x, y) stand here without touching any solid? */
export function circleFits(x, y, radius, solids) {
  for (const rect of solids) {
    const cx = Math.max(rect.x, Math.min(x, rect.x + rect.width));
    const cy = Math.max(rect.y, Math.min(y, rect.y + rect.height));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < radius * radius) return false;
  }
  return true;
}

/** Move a circle by (dx, dy), sliding along walls instead of sticking to them. */
export function moveCircle(pos, dx, dy, radius, solids) {
  let { x, y } = pos;
  if (dx !== 0 && circleFits(x + dx, y, radius, solids)) x += dx;
  if (dy !== 0 && circleFits(x, y + dy, radius, solids)) y += dy;
  return { x, y };
}
