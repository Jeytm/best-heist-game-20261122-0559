// The Gilded Vault — the room itself: where the walls, cover, vault and exit sit, and
// where the guards walk and the cameras hang. Three routes cross it: the left colonnade
// (past one guard), the right gallery (past a camera and one guard) and the open middle
// floor (fast, no cover at all). Every rect here blocks movement and blocks sight.
import { ROOM } from './config.js';

// Cover blocks: plinths with exhibits and the marble statue in the middle. A thief behind
// one cannot be seen, which is the whole game: hop from cover to cover between sweeps.
export const COVER_BLOCKS = [
  // Left colonnade: two plinths make a zig-zag lane down the left side.
  { x: 170, y: 210, width: 92, height: 60, label: 'Vase plinth' },
  { x: 170, y: 470, width: 92, height: 60, label: 'Bust plinth' },
  // Centre: the tall statue is the room's biggest piece of cover.
  { x: 560, y: 330, width: 160, height: 110, label: 'Marble statue' },
  // Right gallery: a long display case and a single plinth.
  { x: 880, y: 220, width: 190, height: 54, label: 'Tapestry case' },
  { x: 960, y: 500, width: 92, height: 60, label: 'Coin plinth' },
  // A low bench near the vault, the last cover before the grab.
  { x: 1060, y: 330, width: 70, height: 120, label: 'Bench' },
];

// The vault holding the Sunset Diamond, top-right, behind the right gallery.
export const VAULT = { x: 1150, y: 130, width: 74, height: 74, radius: 78 };

// The getaway: the service door, top-left. It stays locked until the diamond is taken.
export const EXIT = { x: 30, y: 100, width: 64, height: 46 };

// Where the thief slips in, bottom-left, through the service door.
export const SPAWN = { x: 90, y: 640 };

// Guards walk their waypoints in a loop, pausing at each one to look around.
export const GUARD_PATROLS = [
  {
    name: 'Mara',
    waypoints: [
      { x: 330, y: 180 },
      { x: 330, y: 560 },
      { x: 520, y: 560 },
      { x: 520, y: 180 },
    ],
    pauseSeconds: 1.6,
  },
  {
    name: 'Dario',
    waypoints: [
      { x: 830, y: 560 },
      { x: 830, y: 180 },
      { x: 1060, y: 180 },
      { x: 1060, y: 560 },
    ],
    pauseSeconds: 1.2,
  },
  {
    name: 'Ilsa',
    waypoints: [
      { x: 640, y: 620 },
      { x: 640, y: 300 },
      { x: 760, y: 300 },
      { x: 760, y: 620 },
    ],
    pauseSeconds: 2.0,
  },
];

// Wall cameras: fixed to a wall, sweeping their cone across the room.
export const CAMERA_MOUNTS = [
  // North wall, sweeping the right gallery and the vault approach.
  { x: 980, y: 92, baseAngle: Math.PI / 2, sweep: 0.85, name: 'Cam A' },
  // West wall, sweeping the middle floor and the statue.
  { x: 28, y: 360, baseAngle: 0, sweep: 0.8, name: 'Cam B' },
  // South wall, sweeping the spawn lane so the entry is never free.
  { x: 420, y: 700, baseAngle: -Math.PI / 2, sweep: 0.7, name: 'Cam C' },
];

/** The room border plus every cover block: everything sight and movement collide with. */
export function solidRects() {
  const { x, y, width, height } = ROOM;
  const border = 14;
  return [
    { x: x - border, y: y - border, width: width + border * 2, height: border }, // north wall
    { x: x - border, y: y + height, width: width + border * 2, height: border }, // south wall
    { x: x - border, y: y, width: border, height: height }, // west wall
    { x: x + width, y: y, width: border, height: height }, // east wall
    ...COVER_BLOCKS,
    { x: VAULT.x, y: VAULT.y, width: VAULT.width, height: VAULT.height },
  ];
}
