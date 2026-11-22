// The alarm meter — the game's heartbeat. It fills while any guard or camera has eyes on
// the thief (faster up close, slower while sneaking) and drains while the thief is hidden.
// At 100 the run is over: the gallery locks down and the thief is caught. The meter is the
// fair caught moment: it gives a few seconds of warning before it ends the run.
import { ALARM } from './config.js';

export function makeAlarm() {
  return { value: 0, seenBy: null, rising: false };
}

/**
 * Step the meter one frame. `watchers` is every guard/camera that sees the thief this
 * frame, each with a `kind` ('guard' | 'camera') and a distance in px. Returns the name of
 * the closest watcher, or null when nobody sees the thief.
 */
export function updateAlarm(alarm, watchers, sneaking, dt) {
  if (watchers.length === 0) {
    alarm.value = Math.max(0, alarm.value - ALARM.drain * dt);
    alarm.seenBy = null;
    alarm.rising = false;
    return null;
  }
  let closest = watchers[0];
  for (const watcher of watchers) {
    if (watcher.distance < closest.distance) closest = watcher;
  }
  let rate = closest.kind === 'camera' ? ALARM.cameraFill : ALARM.guardFill;
  if (closest.distance < 90) rate += ALARM.closeBonus;
  if (sneaking) rate *= ALARM.sneakFactor;
  alarm.value = Math.min(ALARM.caughtAt, alarm.value + rate * dt);
  alarm.seenBy = closest.name;
  alarm.rising = true;
  return closest.name;
}

/** Cracking the vault trips a sensor: the meter jumps at once. */
export function spikeAlarm(alarm, amount) {
  alarm.value = Math.min(ALARM.caughtAt, alarm.value + amount);
}

export function isCaught(alarm) {
  return alarm.value >= ALARM.caughtAt;
}
