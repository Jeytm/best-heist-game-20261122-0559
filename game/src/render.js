// Render — everything the player sees, drawn on one canvas: the night gallery, the cones
// of light and danger, the thief, the guards, the cameras, the vault, the getaway, and
// the HUD bar with the alarm meter. Safe cover is teal, danger is amber and red, loot is
// gold, the thief is cream — the whole game reads at a glance, even shrunk to a thumbnail.
import { ALARM, CAMERA, COLORS, GUARD, HUD_HEIGHT, LOOT, ROOM, THIEF, VIEW } from './config.js';
import { COVER_BLOCKS, EXIT, VAULT } from './level.js';
import { cameraFacing } from './cameras.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE } from './game.js';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawCone(ctx, origin, facing, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.arc(origin.x, origin.y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.width, ROOM.height);
  // A quiet marble checker so the floor reads as a gallery, not a flat void.
  const tile = 77;
  ctx.fillStyle = COLORS.floorB;
  for (let row = 0; row * tile < ROOM.height; row += 1) {
    for (let col = 0; col * tile < ROOM.width; col += 1) {
      if ((row + col) % 2 === 0) continue;
      ctx.fillRect(ROOM.x + col * tile, ROOM.y + row * tile, tile, tile);
    }
  }
  // Warm pools of lamplight along the walls.
  for (const [x, y] of [[220, 140], [640, 140], [1060, 140], [220, 660], [640, 660], [1060, 660]]) {
    const glow = ctx.createRadialGradient(x, y, 8, x, y, 130);
    glow.addColorStop(0, 'rgba(245, 197, 66, 0.10)');
    glow.addColorStop(1, 'rgba(245, 197, 66, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 130, y - 130, 260, 260);
  }
}

function drawWalls(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(ROOM.x - 14, ROOM.y - 14, ROOM.width + 28, 14);
  ctx.fillRect(ROOM.x - 14, ROOM.y + ROOM.height, ROOM.width + 28, 14);
  ctx.fillRect(ROOM.x - 14, ROOM.y, 14, ROOM.height);
  ctx.fillRect(ROOM.x + ROOM.width, ROOM.y, 14, ROOM.height);
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(ROOM.x - 14, ROOM.y - 14, ROOM.width + 28, 4);
}

function drawCover(ctx) {
  for (const block of COVER_BLOCKS) {
    ctx.fillStyle = COLORS.cover;
    roundRect(ctx, block.x, block.y, block.width, block.height, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.coverTop;
    roundRect(ctx, block.x + 6, block.y + 6, block.width - 12, block.height - 12, 6);
    ctx.fill();
  }
  // The statue gets a little plinth marker so it reads as the room's centrepiece.
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(640, 385, 16, 0, Math.PI * 2);
  ctx.fill();
}

function drawVault(ctx, loot, time) {
  const cx = VAULT.x + VAULT.width / 2;
  const cy = VAULT.y + VAULT.height / 2;
  const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
  const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, 110);
  glow.addColorStop(0, loot.taken ? 'rgba(245, 197, 66, 0.05)' : `rgba(245, 197, 66, ${0.22 + 0.1 * pulse})`);
  glow.addColorStop(1, 'rgba(245, 197, 66, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 110, cy - 110, 220, 220);
  ctx.fillStyle = '#101018';
  roundRect(ctx, VAULT.x, VAULT.y, VAULT.width, VAULT.height, 8);
  ctx.fill();
  ctx.strokeStyle = loot.taken ? '#5a6270' : COLORS.gold;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (!loot.taken) {
    // The diamond: a bright gold gem that is the whole point of the room.
    ctx.fillStyle = COLORS.goldGlow;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx + 13, cy - 2);
    ctx.lineTo(cx, cy + 16);
    ctx.lineTo(cx - 13, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAULT', cx, VAULT.y + VAULT.height + 16);
    if (loot.crackProgress > 0) {
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + loot.crackProgress * Math.PI * 2);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = COLORS.dim;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMPTY', cx, VAULT.y + VAULT.height + 16);
  }
}

function drawExit(ctx, loot, time) {
  const open = loot.exitOpen;
  const pulse = open ? 0.5 + 0.5 * Math.sin(time * 3) : 0;
  ctx.fillStyle = open ? `rgba(61, 220, 132, ${0.25 + 0.15 * pulse})` : 'rgba(90, 98, 112, 0.25)';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.width, EXIT.height);
  ctx.strokeStyle = open ? COLORS.exit : COLORS.exitLocked;
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.width, EXIT.height);
  ctx.fillStyle = open ? COLORS.exit : COLORS.exitLocked;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — OPEN' : 'EXIT — LOCKED', EXIT.x + EXIT.width / 2, EXIT.y + EXIT.height + 16);
  if (open) {
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('➤', EXIT.x + EXIT.width / 2, EXIT.y + EXIT.height / 2 + 7);
  }
}

function drawGuards(ctx, guards, time) {
  // An investigating guard's destination: a pulsing amber ring where they are heading,
  // so the player can read the patrol's next move instead of guessing it.
  for (const guard of guards) {
    if (guard.mode === 'investigate' && guard.target) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 5);
      ctx.strokeStyle = `rgba(232, 177, 60, ${0.35 + 0.4 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(guard.target.x, guard.target.y, 12 + 4 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(232, 177, 60, ${0.5 + 0.3 * pulse})`;
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.target.x, guard.target.y + 5);
    }
  }
  for (const guard of guards) {
    drawCone(ctx, guard, guard.facing, GUARD.coneRange, GUARD.coneHalfAngle, COLORS.guardCone, COLORS.guardConeEdge);
  }
  for (const guard of guards) {
    ctx.fillStyle = '#14101c';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    // The direction the guard is looking: a small nose on the circle.
    ctx.strokeStyle = '#14101c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * (GUARD.radius + 6), guard.y + Math.sin(guard.facing) * (GUARD.radius + 6));
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - GUARD.radius - 8);
    if (guard.mode === 'investigate') {
      ctx.fillStyle = COLORS.guard;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('?', guard.x, guard.y - GUARD.radius - 22);
    }
  }
}

function drawCameras(ctx, cameras, time) {
  for (const camera of cameras) {
    if (camera.loopLeft > 0) continue;
    const facing = cameraFacing(camera, time);
    drawCone(ctx, camera, facing, CAMERA.coneRange, CAMERA.coneHalfAngle, COLORS.cameraCone, COLORS.cameraConeEdge);
  }
  for (const camera of cameras) {
    const looped = camera.loopLeft > 0;
    ctx.fillStyle = '#14101c';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = looped ? '#8a94a0' : COLORS.camera;
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 3, 0, Math.PI * 2);
    ctx.fill();
    if (looped) {
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOOPED', camera.x, camera.y - 18);
    }
  }
}

function drawThief(ctx, thief, time) {
  // A soft shadow so the thief pops off the floor.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + THIEF.radius - 2, THIEF.radius, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = thief.moving ? Math.sin(time * 14) * 1.5 : 0;
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y + bob, THIEF.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefRing;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hat brim: the thief's silhouette is a cream circle with a dark hat.
  ctx.fillStyle = '#1b1626';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y + bob - 3, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1626';
  ctx.fillRect(thief.x - 9, thief.y + bob - 5, 18, 3);
}

function drawCoin(ctx, coin) {
  if (!coin) return;
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a6d1f';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** The HUD bar: title, alarm meter, loot, tools, timer and objective — all in one strip. */
function drawHud(ctx, game) {
  ctx.fillStyle = '#12101c';
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.fillStyle = '#2a2438';
  ctx.fillRect(0, HUD_HEIGHT - 2, VIEW.width, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('THE GILDED VAULT', 24, 30);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(game.loot.taken ? 'Diamond taken — reach the EXIT' : 'Cross the room — crack the VAULT — slip out', 24, 52);

  // Alarm meter: the big one. Green while calm, amber while rising, red near the top.
  const meterX = 470;
  const meterY = 18;
  const meterW = 300;
  const meterH = 24;
  const frac = game.alarm.value / ALARM.caughtAt;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('ALARM', meterX, meterY - 5 + 12);
  ctx.fillStyle = '#241f2e';
  roundRect(ctx, meterX + 70, meterY, meterW, meterH, 6);
  ctx.fill();
  const hue = frac < 0.5 ? '#3ddc84' : frac < 0.8 ? '#f5b43c' : '#e5484d';
  if (frac > 0.01) {
    ctx.fillStyle = hue;
    roundRect(ctx, meterX + 70, meterY, Math.max(10, meterW * frac), meterH, 6);
    ctx.fill();
  }
  ctx.strokeStyle = '#4a4266';
  ctx.lineWidth = 1.5;
  roundRect(ctx, meterX + 70, meterY, meterW, meterH, 6);
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`${Math.round(game.alarm.value)}%`, meterX + 70 + meterW + 10, meterY + 17);
  if (game.alarm.rising && game.alarm.seenBy) {
    ctx.fillStyle = '#e5484d';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`SPOTTED by ${game.alarm.seenBy}!`, meterX + 70, meterY + meterH + 16);
  }

  // Loot, tools and time, right-aligned.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(game.time / 60)}:${String(Math.floor(game.time % 60)).padStart(2, '0')}`, 1060, 28);
  ctx.fillStyle = game.loot.taken ? COLORS.gold : COLORS.dim;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(game.loot.taken ? '◆ $50,000' : '◇ $0', 1256, 28);
  ctx.fillStyle = COLORS.text;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Coins ${game.run.coins} · Loops ${game.run.loops}`, 1256, 50);
}

/** A dimmed message line under the HUD, for tool feedback and hints. */
function drawMessage(ctx, game) {
  if (game.messageLeft <= 0 || !game.message) return;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(18, 16, 28, 0.85)';
  const w = ctx.measureText(game.message).width + 36;
  roundRect(ctx, VIEW.width / 2 - w / 2, HUD_HEIGHT + 6, w, 30, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(game.message, VIEW.width / 2, HUD_HEIGHT + 26);
}

function drawScreen(ctx, game, title, lines, accent) {
  ctx.fillStyle = 'rgba(10, 8, 18, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px system-ui, sans-serif';
  ctx.fillText(title, VIEW.width / 2, 300);
  ctx.fillStyle = COLORS.text;
  ctx.font = '18px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 350 + i * 30));
}

export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#0b0912';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (game.screen === SCREEN_TITLE) {
    drawFloor(ctx);
    drawWalls(ctx);
    drawCover(ctx);
    drawVault(ctx, game.loot, game.time);
    drawExit(ctx, game.loot, game.time);
    drawGuards(ctx, game.guards, game.time);
    drawCameras(ctx, game.cameras, game.time);
    drawThief(ctx, game.thief, game.time);
    drawHud(ctx, game);
    drawScreen(ctx, game, 'THE GILDED VAULT', [
      'A one-room heist: cross the gallery, crack the vault, slip out the service door.',
      'Move WASD / arrows · Shift sneak · E crack the vault · Q / click toss a coin · F loop a camera',
      'Guards patrol with amber cones, cameras sweep red cones — fill the ALARM and you are caught.',
      'Press ENTER to start',
    ], COLORS.gold);
    return;
  }
  drawFloor(ctx);
  drawWalls(ctx);
  drawCover(ctx);
  drawVault(ctx, game.loot, game.time);
  drawExit(ctx, game.loot, game.time);
  drawGuards(ctx, game.guards, game.time);
  drawCameras(ctx, game.cameras, game.time);
  drawCoin(ctx, game.run.coin);
  drawThief(ctx, game.thief, game.time);
  drawHud(ctx, game);
  drawMessage(ctx, game);
  if (game.spottedFlash > 0) {
    ctx.fillStyle = `rgba(229, 72, 77, ${game.spottedFlash * 0.9})`;
    ctx.fillRect(0, 0, VIEW.width, 8);
    ctx.fillRect(0, VIEW.height - 8, VIEW.width, 8);
  }
  if (game.screen === SCREEN_CAUGHT) {
    drawScreen(ctx, game, 'BUSTED!', [
      'The alarm hit 100% and the gallery locked down.',
      'Watch the cones. Sneak behind cover. Toss a coin to pull a guard away.',
      'Press R to try again',
    ], '#e5484d');
  } else if (game.screen === SCREEN_ESCAPED) {
    drawScreen(ctx, game, 'CLEAN GETAWAY!', [
      `${LOOT.name} — $50,000 — is yours.`,
      `Score ${game.score.toLocaleString('en-US')} · ${Math.floor(game.time)}s · ${3 - game.run.coins} coins and ${2 - game.run.loops} loops spent`,
      'Press R to run it again',
    ], COLORS.exit);
  } else if (game.paused) {
    drawScreen(ctx, game, 'PAUSED', ['Press P to resume'], COLORS.text);
  }
}
