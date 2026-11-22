// Screenshot scenes — the four frames the entry hands in, staged straight from the real
// game state and drawn by the real renderer, so each shot is exactly what a player sees
// mid-run. A `?shot=<name>` URL picks one; any other value is the cover. The staging sets
// positions, facings, the alarm and the loot by hand (no autopilot), so the same URL always
// gives the same frame, and every frame shows the whole room: thief, guards and their
// amber cones, cameras and their red cones, the gold vault, the exit and the alarm meter.
import { SCREEN_PLAY } from './game.js';
import { EXIT } from './level.js';

function placeGuard(game, index, x, y, facing, mode = 'patrol') {
  const guard = game.guards[index];
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.mode = mode;
  guard.pauseLeft = 0;
  guard.target = null;
}

function setAlarm(game, value, seenBy) {
  game.alarm.value = value;
  game.alarm.seenBy = seenBy;
  game.alarm.rising = value > 0 && seenBy !== null;
}

/**
 * Put `game` into the named scene and return the screen to draw. The game must already
 * be started (startRun has run) so the guards, cameras and loot exist.
 */
export function stageShot(name, game) {
  game.screen = SCREEN_PLAY;
  game.paused = false;
  game.message = '';
  game.messageLeft = 0;
  game.spottedFlash = 0;

  if (name === 'cover-sweep') {
    // The thief pressed behind the tapestry case — the case blocks Dario's cone — while
    // Cam A's red cone sweeps past just to the side.
    game.time = 3.4;
    game.thief.x = 1000;
    game.thief.y = 205;
    game.thief.facing = -Math.PI / 2;
    placeGuard(game, 0, 330, 420, Math.PI / 2);
    placeGuard(game, 1, 900, 480, -Math.PI / 2);
    placeGuard(game, 2, 700, 330, Math.PI);
    setAlarm(game, 8, null);
    game.message = 'Hold still — the camera sweeps past…';
    game.messageLeft = 99;
    return SCREEN_PLAY;
  }

  if (name === 'alarm-rising') {
    // Caught in Mara's cone at the edge of the statue: the meter climbs, she closes in.
    game.time = 7.9;
    game.thief.x = 600;
    game.thief.y = 470;
    game.thief.facing = Math.PI;
    placeGuard(game, 0, 520, 380, Math.PI / 2, 'investigate');
    game.guards[0].target = { x: 600, y: 470 };
    game.guards[0].investigateLeft = 3;
    placeGuard(game, 1, 900, 220, Math.PI / 2);
    placeGuard(game, 2, 700, 560, -Math.PI / 2);
    setAlarm(game, 62, 'Mara');
    game.spottedFlash = 0.2;
    game.message = 'SPOTTED — break line of sight, fast!';
    game.messageLeft = 99;
    return SCREEN_PLAY;
  }

  if (name === 'loot-getaway') {
    // The diamond is out, the vault is empty, the exit is open and the thief is running
    // for it with the alarm still hot from the crack.
    game.time = 12.6;
    game.loot.taken = true;
    game.loot.value = 50000;
    game.loot.exitOpen = true;
    game.thief.x = 300;
    game.thief.y = 160;
    game.thief.facing = Math.PI;
    placeGuard(game, 0, 430, 300, -Math.PI / 2, 'investigate');
    game.guards[0].target = { x: 300, y: 160 };
    game.guards[0].investigateLeft = 2;
    placeGuard(game, 1, 900, 480, Math.PI);
    placeGuard(game, 2, 700, 420, 0);
    setAlarm(game, 45, null);
    game.run.coins = 1;
    game.run.loops = 0;
    game.message = 'Diamond taken — get to the service door!';
    game.messageLeft = 99;
    return SCREEN_PLAY;
  }

  // cover: the whole room in one frame — thief slipping past the statue while Mara's
  // cone sweeps the colonnade, a camera covers the right gallery, the vault glows gold.
  game.time = 5.1;
  game.thief.x = 480;
  game.thief.y = 480;
  game.thief.facing = Math.PI / 4;
  placeGuard(game, 0, 330, 300, Math.PI / 2);
  placeGuard(game, 1, 900, 300, -Math.PI / 2);
  placeGuard(game, 2, 700, 500, 0);
  setAlarm(game, 12, null);
  return SCREEN_PLAY;
}

/** The exit doorway's centre, for the play-test that walks the thief out. */
export function exitCentre() {
  return { x: EXIT.x + EXIT.width / 2, y: EXIT.y + EXIT.height / 2 };
}
