// Sound — every blip is synthesized with the Web Audio API, so the game needs no audio
// files at all. Nothing plays until the player presses a key or clicks (browsers demand
// a gesture first), and M mutes everything. Quiet by design: a soft tick as the alarm
// climbs, a chime when the diamond comes out, a low sting when the run ends.
export function makeAudio() {
  return { ctx: null, muted: false, lastTick: 0 };
}

function context(audio) {
  if (!audio.ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audio.ctx = new Ctor();
  }
  if (audio.ctx.state === 'suspended') void audio.ctx.resume();
  return audio.ctx;
}

/** A short sine blip at `freq` Hz, `seconds` long, at `gain` volume. */
function blip(audio, freq, seconds, gain, when = 0) {
  if (audio.muted) return;
  const ctx = context(audio);
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(gain, t + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.05);
}

export function playTick(audio) {
  blip(audio, 1180, 0.07, 0.05);
}

export function playCoin(audio) {
  blip(audio, 1560, 0.09, 0.08);
  blip(audio, 2090, 0.12, 0.06, 0.07);
}

export function playLoop(audio) {
  blip(audio, 740, 0.1, 0.07);
  blip(audio, 520, 0.16, 0.07, 0.09);
}

export function playGrab(audio) {
  blip(audio, 660, 0.12, 0.1);
  blip(audio, 880, 0.12, 0.1, 0.1);
  blip(audio, 1320, 0.22, 0.1, 0.2);
}

export function playCaught(audio) {
  blip(audio, 220, 0.35, 0.12);
  blip(audio, 165, 0.5, 0.12, 0.2);
}

export function playWin(audio) {
  blip(audio, 523, 0.14, 0.1);
  blip(audio, 659, 0.14, 0.1, 0.12);
  blip(audio, 784, 0.14, 0.1, 0.24);
  blip(audio, 1047, 0.3, 0.1, 0.36);
}
