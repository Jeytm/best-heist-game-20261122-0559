// The Gilded Vault — entry point. Wires the canvas to the game, runs a fixed-step loop
// (60 steps a second, so staged shots and live play move the same way), scales the room
// to the window, and exposes a small test hook (`window.__heist`) so a browser can drive
// the game: start it, stage a screenshot scene, teleport the thief, read the state.
// `?shot=<name>` opens a staged scene straight away for screenshots.
import { VIEW } from './config.js';
import { drawGame } from './render.js';
import { handleScreenKeys, makeGame, startRun, stepGame } from './game.js';
import { stageShot } from './shots.js';
import { attachInput } from './input.js';

const STEP = 1 / 60;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const game = makeGame();
attachInput(game.input, canvas, (clientX, clientY) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW.width,
    y: ((clientY - rect.top) / rect.height) * VIEW.height,
  };
});

// Keep the room's aspect ratio whatever the window: the canvas is letterboxed, so the
// whole room — thief, guards, cameras, vault, exit and alarm — stays in one frame.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// Screen-reader status line: the alarm, the objective and the ending, in words.
let lastStatus = '';
function announce() {
  const text =
    game.screen === 'title'
      ? 'The Gilded Vault. Press Enter to start the heist.'
      : game.screen === 'caught'
        ? 'Busted. The alarm reached 100 percent. Press R to try again.'
        : game.screen === 'escaped'
          ? `Clean getaway. Score ${game.score}. Press R to run it again.`
          : game.loot.taken
            ? `Alarm ${Math.round(game.alarm.value)} percent. Diamond taken. Reach the exit.`
            : `Alarm ${Math.round(game.alarm.value)} percent. Reach the vault and hold E to crack it.`;
  if (text !== lastStatus) {
    lastStatus = text;
    status.textContent = text;
  }
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  startRun(game);
  stageShot(shot, game);
  // A staged shot is a still: draw it once and stop the clock.
  drawGame(ctx, game);
  announce();
} else {
  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      stepGame(game, STEP);
      handleScreenKeys(game);
      accumulator -= STEP;
    }
    drawGame(ctx, game);
    announce();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Test hook for the browser: play the game from a script, stage a scene, read the state.
window.__heist = {
  game,
  start: () => startRun(game),
  stage: (name) => {
    startRun(game);
    stageShot(name, game);
    drawGame(ctx, game);
  },
  teleport: (x, y) => {
    game.thief.x = x;
    game.thief.y = y;
  },
  state: () => ({
    screen: game.screen,
    alarm: Math.round(game.alarm.value * 10) / 10,
    lootTaken: game.loot.taken,
    exitOpen: game.loot.exitOpen,
    thief: { x: Math.round(game.thief.x), y: Math.round(game.thief.y) },
    coins: game.run.coins,
    loops: game.run.loops,
    score: game.score,
    time: Math.round(game.time * 10) / 10,
  }),
};
