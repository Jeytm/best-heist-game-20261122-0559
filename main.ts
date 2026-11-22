// The Gilded Vault — the hand-in program (Node 22, standard library only). It copies
// the game (game/) and its screenshots (screenshots/) from beside this file to /output
// and writes /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The run is deterministic: the same files in always produce the same bytes out, so the
// grader's two runs agree byte for byte.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a plain message when the hand-in is incomplete, instead of writing a
// half-empty /output the scorer would refuse: the game must exist, and so must at
// least 3 screenshots (the gate wants 3 to 4).
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error(`game/index.html is missing in ${here}`);
}
const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((name) => !name.startsWith('.')) : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's caps: only text_max_bytes shapes the dossier's bytes; the rest refuse an
// entry the scorer would refuse (more than 4 screenshots or one over 256 KiB; game/ over
// 993 files or 48 MiB in all, or a path under game/ over 1000 bytes).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// A one-line receipt on stdout so a run's output says what it handed in.
const shotBytes = shots.reduce((sum, name) => sum + statSync(join(shotsDir, name)).size, 0);
console.log(`handed in: game/ + ${shots.length} screenshots (${shotBytes} bytes) + dossier.json (${dossier.length} bytes) -> ${out}`);
