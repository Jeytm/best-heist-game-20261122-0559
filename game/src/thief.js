// The thief — movement and tools. WASD or arrows move; Shift sneaks (slower, harder to
// spot). Q tosses a coin to a floor spot (or click the spot with the mouse): the nearest
// guard in earshot walks over to look at it. F loops the nearest camera so it goes blind
// for a few seconds. Both tools are spent, never free: coins and loops run out.
import { CAMERA, GUARD, THIEF, TOOLS } from './config.js';
import { solidRects } from './level.js';
import { nearestCamera } from './cameras.js';
import { nearestGuard, sendGuardTo } from './guards.js';
import { moveCircle } from './sight.js';

export function makeThief(x, y) {
  return { x, y, facing: 0, moving: false, sneaking: false };
}

/** Step the thief one frame from the held keys. Returns true while the thief is moving. */
export function updateThief(thief, keys, dt) {
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  thief.sneaking = keys.sneak;
  const speed = thief.sneaking ? THIEF.sneakSpeed : THIEF.speed;
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    const next = moveCircle(thief, (dx / len) * speed * dt, (dy / len) * speed * dt, THIEF.radius, solidRects());
    thief.x = next.x;
    thief.y = next.y;
    thief.facing = Math.atan2(dy, dx);
    thief.moving = true;
    return true;
  }
  thief.moving = false;
  return false;
}

/**
 * Toss a coin to a floor spot. The nearest guard in earshot leaves their patrol to look
 * at it. Returns 'tossed' when a coin flew, 'none-left' with no coins, or 'no-guard'
 * when no guard is close enough to hear it land.
 */
export function tossCoin(run, guards, point) {
  if (run.coins <= 0) return 'none-left';
  run.coins -= 1;
  run.coin = { x: point.x, y: point.y, ttl: 5 };
  const guard = nearestGuard(guards, point, TOOLS.coinLureRadius);
  if (!guard) return 'no-guard';
  sendGuardTo(guard, point, GUARD.investigateSeconds);
  return 'tossed';
}

/**
 * Loop the nearest camera: its cone goes dark and it sees nothing for a while. Returns
 * 'looped' when a camera was frozen, 'none-left' with no loops, or 'no-camera' when no
 * camera is close enough to reach.
 */
export function loopCamera(run, cameras, thief) {
  if (run.loops <= 0) return 'none-left';
  const camera = nearestCamera(cameras, thief, 340);
  if (!camera) return 'no-camera';
  run.loops -= 1;
  camera.loopLeft = CAMERA.loopSeconds;
  return 'looped';
}
