// The Gilded Vault — one-room gallery heist. All tuning lives here so the rest of the
// game reads like a rulebook: canvas size, movement, sight, alarm, tools and scoring.
export const VIEW = { width: 1280, height: 720 };
export const HUD_HEIGHT = 72;

// The room the thief crosses: the canvas below the HUD bar. Walls are the outer border.
export const ROOM = { x: 24, y: HUD_HEIGHT + 16, width: 1232, height: 616 };

export const THIEF = {
  radius: 13,
  speed: 205, // px per second on open floor
  sneakSpeed: 120, // holding Shift: slower, quieter, halves the alarm fill rate
  crackSeconds: 2.0, // hold E at the vault to crack it open
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  chaseSpeed: 132, // closing on a last-seen spot or a tossed coin
  coneRange: 235,
  coneHalfAngle: 0.42, // radians either side of the facing direction
  investigateSeconds: 4.5,
};

export const CAMERA = {
  coneRange: 265,
  coneHalfAngle: 0.34,
  sweepSeconds: 5.2, // one full sweep left-to-right and back
  loopSeconds: 6, // how long a looped camera stays blind
};

export const ALARM = {
  // Per second while spotted. A guard fills slower than a camera; being close hurts more.
  guardFill: 26,
  cameraFill: 34,
  closeBonus: 14, // extra per second when the spotter is within 90 px
  sneakFactor: 0.5, // sneaking halves the fill rate
  drain: 9, // per second while no one sees the thief
  grabSpike: 15, // cracking the vault trips a sensor and adds this much at once
  caughtAt: 100,
};

export const TOOLS = {
  coins: 3, // toss one (Q, or click a floor spot) to pull the nearest guard over
  loops: 2, // loop the nearest camera (F) so its cone goes dark for a while
  coinLureRadius: 240, // a guard only hears a coin that lands this close
};

export const LOOT = { value: 50000, name: 'the Sunset Diamond' };

// Score is the take minus the cost of being slow and loud: every second and every tool
// spent comes off the purse, so a clean fast run pays more than a clumsy one.
export const SCORING = { perSecond: 100, perTool: 2000 };

export const COLORS = {
  floorA: '#1c1a26',
  floorB: '#211e2e',
  wall: '#3a3350',
  wallTop: '#4a4266',
  cover: '#2e5d5a', // plinths and the statue: solid teal, reads as safe cover
  coverTop: '#3f7d78',
  gold: '#f5c542',
  goldGlow: '#ffe9a3',
  guardCone: 'rgba(245, 180, 60, 0.20)', // amber: a guard is watching here
  guardConeEdge: 'rgba(245, 180, 60, 0.55)',
  cameraCone: 'rgba(235, 70, 70, 0.20)', // red: a camera is watching here
  cameraConeEdge: 'rgba(235, 70, 70, 0.55)',
  loopedCone: 'rgba(140, 150, 160, 0.10)',
  thief: '#f2ead8', // cream suit: the thief is always easy to find in the frame
  thiefRing: '#ffffff',
  guard: '#e8b13c',
  camera: '#e5484d',
  exit: '#3ddc84',
  exitLocked: '#5a6270',
  text: '#efe9dc',
  dim: '#9a93a8',
};
