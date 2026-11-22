// The Gilded Vault — the game itself. One state machine, four screens:
// title → playing → caught | escaped. The update step is fixed-timestep so a staged
// screenshot and a live run move the same way: guards patrol, cameras sweep, the alarm
// fills while the thief is seen and drains while hidden, the vault cracks on E, and the
// getaway only opens once the diamond is in hand.
import { CAMERA, GUARD, LOOT, SCORING } from './config.js';
import { SPAWN } from './level.js';
import { makeAlarm, updateAlarm, isCaught } from './alarm.js';
import { cameraSeesThief, makeCameras, updateCameras } from './cameras.js';
import { guardSeesThief, makeGuards, sendGuardTo, updateGuards } from './guards.js';
import { atExit, atVault, freshRun, makeLoot, updateLoot } from './loot.js';
import { loopCamera, makeThief, tossCoin, updateThief } from './thief.js';
import { makeAudio, playCaught, playCoin, playGrab, playLoop, playTick, playWin } from './audio.js';
import { endFrame, makeInput, wasPressed } from './input.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

export function makeGame() {
  const run = freshRun();
  return {
    screen: SCREEN_TITLE,
    time: 0,
    thief: makeThief(SPAWN.x, SPAWN.y),
    guards: makeGuards(),
    cameras: makeCameras(),
    alarm: makeAlarm(),
    loot: makeLoot(),
    run,
    audio: makeAudio(),
    input: makeInput(),
    paused: false,
    score: 0,
    message: '',
    messageLeft: 0,
    spottedFlash: 0,
  };
}

function showMessage(game, text, seconds) {
  game.message = text;
  game.messageLeft = seconds;
}

/** Score the run: the take, less a little for every second and every tool spent. */
export function finalScore(game) {
  const toolsSpent = 3 - game.run.coins + (2 - game.run.loops);
  const raw = LOOT.value - Math.floor(game.time) * SCORING.perSecond - toolsSpent * SCORING.perTool;
  return Math.max(0, raw);
}

/** Start a fresh run from the title screen. */
export function startRun(game) {
  const run = freshRun();
  game.run = run;
  game.thief = makeThief(SPAWN.x, SPAWN.y);
  game.guards = makeGuards();
  game.cameras = makeCameras();
  game.alarm = makeAlarm();
  game.loot = makeLoot();
  game.time = 0;
  game.score = 0;
  game.screen = SCREEN_PLAY;
  game.paused = false;
  game.message = '';
  game.spottedFlash = 0;
}

/** One fixed step (1/60 s) of the playing game. */
export function stepGame(game, dt) {
  if (game.screen !== SCREEN_PLAY || game.paused) return;
  const input = game.input;
  game.time += dt;
  if (game.messageLeft > 0) game.messageLeft -= dt;
  if (game.spottedFlash > 0) game.spottedFlash -= dt;
  if (game.run.coin) {
    game.run.coin.ttl -= dt;
    if (game.run.coin.ttl <= 0) game.run.coin = null;
  }

  // Tools: Q tosses a coin ahead of the thief, F loops the nearest camera, click tosses
  // a coin exactly where the mouse landed.
  if (wasPressed(input, 'KeyQ')) {
    const ahead = {
      x: game.thief.x + Math.cos(game.thief.facing) * 90,
      y: game.thief.y + Math.sin(game.thief.facing) * 90,
    };
    const result = tossCoin(game.run, game.guards, ahead);
    if (result === 'tossed') {
      showMessage(game, 'Coin tossed — a guard goes to look', 2.2);
      playCoin(game.audio);
    } else if (result === 'none-left') {
      showMessage(game, 'No coins left', 1.6);
    } else {
      showMessage(game, 'No guard in earshot', 1.6);
    }
  }
  if (wasPressed(input, 'KeyF')) {
    const result = loopCamera(game.run, game.cameras, game.thief);
    if (result === 'looped') {
      showMessage(game, `Camera looped — blind for ${CAMERA.loopSeconds}s`, 2.2);
      playLoop(game.audio);
    } else if (result === 'none-left') {
      showMessage(game, 'No loops left', 1.6);
    } else {
      showMessage(game, 'No camera in reach', 1.6);
    }
  }
  if (input.click) {
    const point = input.click;
    input.click = null;
    const result = tossCoin(game.run, game.guards, point);
    if (result === 'tossed') {
      showMessage(game, 'Coin tossed — a guard goes to look', 2.2);
      playCoin(game.audio);
    } else if (result === 'none-left') {
      showMessage(game, 'No coins left', 1.6);
    }
  }
  if (wasPressed(input, 'KeyM')) game.audio.muted = !game.audio.muted;
  if (wasPressed(input, 'KeyP')) {
    game.paused = !game.paused;
    showMessage(game, game.paused ? 'Paused — P to resume' : 'Back to it', 1.2);
  }

  updateThief(game.thief, input.keys, dt);
  updateGuards(game.guards, dt, game.time);
  updateCameras(game.cameras, dt);

  // Who sees the thief this frame? Every watcher reports in; the alarm fills from the
  // closest one, and the closest watcher also learns where the thief is.
  const watchers = [];
  for (const guard of game.guards) {
    if (guardSeesThief(guard, game.thief)) {
      watchers.push({ kind: 'guard', name: guard.name, distance: Math.hypot(guard.x - game.thief.x, guard.y - game.thief.y) });
    }
  }
  for (const camera of game.cameras) {
    if (cameraSeesThief(camera, game.thief, game.time)) {
      watchers.push({ kind: 'camera', name: camera.name, distance: Math.hypot(camera.x - game.thief.x, camera.y - game.thief.y) });
    }
  }
  const seenBy = updateAlarm(game.alarm, watchers, game.thief.sneaking, dt);
  if (seenBy) {
    game.spottedFlash = 0.25;
    const watcher = watchers.find((w) => w.name === seenBy);
    if (watcher && watcher.kind === 'guard') {
      const guard = game.guards.find((g) => g.name === seenBy);
      if (guard && guard.mode !== 'investigate') {
        sendGuardTo(guard, { x: game.thief.x, y: game.thief.y }, GUARD.investigateSeconds);
      }
    }
    // A soft tick while the meter climbs, faster as it nears the top.
    if (game.time - game.audio.lastTick > Math.max(0.12, 0.5 - game.alarm.value / 250)) {
      game.audio.lastTick = game.time;
      playTick(game.audio);
    }
  }

  // The vault: hold E beside it to crack it. The grab spikes the alarm — the sensor
  // notices the case opening, so the getaway starts under pressure.
  const cracking = input.keys.crack && atVault(game.thief);
  if (updateLoot(game.loot, game.thief, cracking, game.alarm, dt) === 'taken') {
    showMessage(game, `${LOOT.name} taken — get to the service door!`, 3.5);
    playGrab(game.audio);
  }
  if (!game.loot.taken && atVault(game.thief) && !cracking) {
    showMessage(game, 'Hold E to crack the vault', 0.4);
  }

  if (isCaught(game.alarm)) {
    game.screen = SCREEN_CAUGHT;
    game.score = 0;
    playCaught(game.audio);
    return;
  }
  if (game.loot.taken && atExit(game.thief, game.loot)) {
    game.screen = SCREEN_ESCAPED;
    game.score = finalScore(game);
    playWin(game.audio);
  }
}

/** Screen-level keys: Enter starts, R restarts after an ending. */
export function handleScreenKeys(game) {
  const input = game.input;
  if (game.screen === SCREEN_TITLE && wasPressed(input, 'Enter')) startRun(game);
  if ((game.screen === SCREEN_CAUGHT || game.screen === SCREEN_ESCAPED) && wasPressed(input, 'KeyR')) {
    startRun(game);
  }
  endFrame(input);
}
