[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Jeytm/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Jeytm/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# The Gilded Vault — a one-room heist

A complete, original top-down heist game that plays offline in a desktop browser from
its own static files. Built for the [make.fun bounty](https://make.fun/bounty/best-heist-game-20261122-0559).

You are the thief in a night gallery. Cross the room, crack the vault holding the
Sunset Diamond, and slip out the service door — while three guards patrol with amber
vision cones, three wall cameras sweep red cones across the floor, and the alarm meter
fills every second you are seen.

## How to play

- **Move** — WASD or arrow keys. **Shift** sneaks (slower, harder to spot).
- **E** — hold beside the vault to crack it open (2 seconds; it trips the alarm).
- **Q or click** — toss a coin: the nearest guard in earshot walks over to look.
- **F** — loop the nearest camera: blind for 6 seconds.
- **P** pause · **M** mute · **R** restart after an ending · **Enter** start.

The alarm fills while any guard or camera sees you (faster up close, slower while
sneaking) and drains while you are hidden. At 100% the gallery locks down and the run
ends. The getaway door stays locked until the diamond is in hand; your score is the
$50,000 take minus time and tools spent.

Three routes cross the room: the left colonnade (one guard), the right gallery (a
camera and a guard), and the open middle floor (fast, no cover). Safe cover is teal,
danger is amber and red, loot is gold — the whole game reads at a glance.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no libraries — plain Canvas 2D and the Web Audio
API (all sounds synthesized, no audio files).

## Layout

- `game/` — the game: `index.html`, `styles.css`, `src/` (one file per job: `game.js`,
  `guards.js`, `cameras.js`, `alarm.js`, `loot.js`, `thief.js`, `level.js`, `sight.js`,
  `render.js`, `input.js`, `audio.js`, `shots.js`, `config.js`, `main.js`)
- `screenshots/` — four real renders of the game in a browser
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and
  writes `dossier.json` with the vendored `vendor/makefun-game.ts`
- `serve.ts` — tiny static server for local play

## License

MIT — see [LICENSE](LICENSE).
