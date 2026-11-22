// Input — keyboard and mouse, and nothing else. WASD or arrows move, Shift sneaks, E
// cracks the vault, Q tosses a coin forward, F loops the nearest camera, Enter starts,
// R restarts, M mutes, P pauses. A mouse click tosses a coin exactly where it lands.
// The game exposes the held keys so the update loop just reads them each frame.
export function makeInput() {
  return {
    keys: { left: false, right: false, up: false, down: false, sneak: false, crack: false },
    pressed: new Set(), // keys pressed since the last frame was read (edge-triggered)
    click: null, // a floor point the mouse just clicked, consumed by the game loop
  };
}

const MOVE_KEYS = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
};

export function attachInput(input, canvas, toGamePoint) {
  window.addEventListener('keydown', (event) => {
    if (MOVE_KEYS[event.code]) {
      input.keys[MOVE_KEYS[event.code]] = true;
      event.preventDefault();
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.keys.sneak = true;
    if (event.code === 'KeyE') input.keys.crack = true;
    if (!event.repeat) input.pressed.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (MOVE_KEYS[event.code]) input.keys[MOVE_KEYS[event.code]] = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.keys.sneak = false;
    if (event.code === 'KeyE') input.keys.crack = false;
  });
  canvas.addEventListener('mousedown', (event) => {
    input.click = toGamePoint(event.clientX, event.clientY);
  });
  window.addEventListener('blur', () => {
    input.keys.left = false;
    input.keys.right = false;
    input.keys.up = false;
    input.keys.down = false;
    input.keys.sneak = false;
    input.keys.crack = false;
  });
}

/** Was `code` pressed since the last frame? Consumes the press. */
export function wasPressed(input, code) {
  if (!input.pressed.has(code)) return false;
  input.pressed.delete(code);
  return true;
}

/** Clear the edge-triggered presses at the end of each frame. */
export function endFrame(input) {
  input.pressed.clear();
}
