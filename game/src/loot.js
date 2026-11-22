// The loot and the getaway — what the run is for. The Sunset Diamond sits in a glass
// vault at the far end of the room; hold E beside it to crack it open. The crack trips a
// sensor, so the grab itself is a risk. The service door (the getaway) stays locked until
// the diamond is in hand, and walking out through it with the loot wins the run.
import { ALARM, LOOT, THIEF, TOOLS } from './config.js';
import { EXIT, SPAWN, VAULT } from './level.js';
import { spikeAlarm } from './alarm.js';

export function makeLoot() {
  return {
    taken: false,
    crackProgress: 0, // 0..1 while the thief holds E at the vault
    exitOpen: false,
    value: 0,
  };
}

/** Is the thief close enough to work on the vault? */
export function atVault(thief) {
  const cx = VAULT.x + VAULT.width / 2;
  const cy = VAULT.y + VAULT.height / 2;
  return Math.hypot(thief.x - cx, thief.y - cy) <= VAULT.radius;
}

/**
 * Step the crack: while the thief holds E at the vault the progress climbs; letting go
 * (or stepping away) lets it slip back. Taking the diamond spikes the alarm and unlocks
 * the getaway. Returns 'taken' on the frame the diamond comes out, else null.
 */
export function updateLoot(loot, thief, cracking, alarm, dt) {
  if (loot.taken) return null;
  if (cracking && atVault(thief)) {
    loot.crackProgress += dt / THIEF.crackSeconds;
    if (loot.crackProgress >= 1) {
      loot.taken = true;
      loot.value = LOOT.value;
      loot.exitOpen = true;
      spikeAlarm(alarm, ALARM.grabSpike);
      return 'taken';
    }
  } else {
    loot.crackProgress = Math.max(0, loot.crackProgress - dt * 0.8);
  }
  return null;
}

/** Is the thief standing in the getaway doorway? Only counts once the loot is taken. */
export function atExit(thief, loot) {
  if (!loot.exitOpen) return false;
  return (
    thief.x >= EXIT.x - 6 &&
    thief.x <= EXIT.x + EXIT.width + 6 &&
    thief.y >= EXIT.y - 6 &&
    thief.y <= EXIT.y + EXIT.height + 6
  );
}

/** A fresh run: thief back at the service door, vault sealed, exit locked, tools refilled. */
export function freshRun() {
  return {
    thief: { x: SPAWN.x, y: SPAWN.y },
    coins: TOOLS.coins,
    loops: TOOLS.loops,
    coin: null, // a tossed coin lying on the floor, {x, y, ttl}
  };
}
