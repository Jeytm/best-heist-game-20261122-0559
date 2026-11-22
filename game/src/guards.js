// Guards — the patrols the thief has to read before moving. Each guard walks a loop of
// waypoints, pauses to look around, and watches a cone in front of them. When a guard
// sees the thief they hurry to the last-seen spot and keep looking; a tossed coin pulls
// them to the sound instead. A guard never sees through a wall or a plinth.
import { GUARD } from './config.js';
import { GUARD_PATROLS, solidRects } from './level.js';
import { angleDiff, hasLineOfSight, moveCircle, pointInCone } from './sight.js';

export function makeGuards() {
  return GUARD_PATROLS.map((patrol, index) => {
    const first = patrol.waypoints[0];
    const second = patrol.waypoints[1];
    return {
      name: patrol.name,
      x: first.x,
      y: first.y,
      facing: Math.atan2(second.y - first.y, second.x - first.x),
      waypoints: patrol.waypoints,
      waypointIndex: 1,
      pauseSeconds: patrol.pauseSeconds,
      pauseLeft: 0,
      // 'patrol' | 'investigate' — investigating means walking to a spot (a last-seen
      // position or a coin) and looking around there before resuming the round.
      mode: 'patrol',
      target: null,
      investigateLeft: 0,
      lookAround: 0,
      seed: index * 1.7,
    };
  });
}

/** Turn a guard to face a point, at most `rate` radians per second. */
function turnTowards(guard, x, y, rate, dt) {
  const wanted = Math.atan2(y - guard.y, x - guard.x);
  const diff = angleDiff(guard.facing, wanted);
  const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
  guard.facing += step;
}

function arriveAt(guard, point, dt, speed) {
  const dx = point.x - guard.x;
  const dy = point.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  const step = Math.min(dist, speed * dt);
  const next = moveCircle(guard, (dx / dist) * step, (dy / dist) * step, GUARD.radius, solidRects());
  guard.x = next.x;
  guard.y = next.y;
  turnTowards(guard, point.x, point.y, 6, dt);
  return false;
}

export function updateGuards(guards, dt, time) {
  for (const guard of guards) {
    if (guard.mode === 'investigate') {
      if (guard.target && !arriveAt(guard, guard.target, dt, GUARD.chaseSpeed)) {
        continue;
      }
      // Arrived: sweep the room for a while, then walk back to the patrol.
      guard.investigateLeft -= dt;
      guard.facing += Math.sin(time * 2.2 + guard.seed) * 1.4 * dt;
      if (guard.investigateLeft <= 0) {
        guard.mode = 'patrol';
        guard.target = null;
        // Resume from the nearest waypoint so the guard does not cut across the room.
        let best = 0;
        let bestDist = Infinity;
        guard.waypoints.forEach((point, i) => {
          const d = Math.hypot(point.x - guard.x, point.y - guard.y);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        guard.waypointIndex = best;
      }
      continue;
    }
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      // A paused guard slowly scans left and right instead of staring at a wall.
      guard.facing += Math.sin(time * 1.5 + guard.seed) * 0.9 * dt;
      continue;
    }
    const point = guard.waypoints[guard.waypointIndex];
    if (arriveAt(guard, point, dt, GUARD.patrolSpeed)) {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      guard.pauseLeft = guard.pauseSeconds;
    }
  }
}

/** Send a guard to look at a spot (a coin they heard, or where they last saw the thief). */
export function sendGuardTo(guard, point, seconds) {
  guard.mode = 'investigate';
  guard.target = { x: point.x, y: point.y };
  guard.investigateLeft = seconds;
}

/** The nearest patrolling guard to a point, within `maxDist` — the one a coin distracts. */
export function nearestGuard(guards, point, maxDist) {
  let best = null;
  let bestDist = maxDist;
  for (const guard of guards) {
    const d = Math.hypot(guard.x - point.x, guard.y - point.y);
    if (d < bestDist) {
      bestDist = d;
      best = guard;
    }
  }
  return best;
}

/** Does this guard see the thief right now? Cone, range, and an unblocked line of sight. */
export function guardSeesThief(guard, thief) {
  if (!pointInCone(guard, guard.facing, GUARD.coneRange, GUARD.coneHalfAngle, thief)) return false;
  return hasLineOfSight(guard, thief, solidRects());
}
