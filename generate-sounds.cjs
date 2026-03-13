/**
 * Professional Sound Generator for S-FIGHT PRO
 * Generates WAV audio files using raw PCM synthesis
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = path.join(__dirname, 'public', 'sounds');

function createWav(samples, sampleRate = SAMPLE_RATE) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);        // fmt chunk size
  buffer.writeUInt16LE(1, 20);         // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32); // FIXED: was 30
  buffer.writeUInt16LE(bitsPerSample, 34); // FIXED: was 32
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buffer;
}

// === DSP ===
function sine(freq, duration, amp = 1) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) out[i] = amp * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
  return out;
}
function square(freq, duration, amp = 1) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) out[i] = amp * (Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE) > 0 ? 1 : -1);
  return out;
}
function saw(freq, duration, amp = 1) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) out[i] = amp * (2 * ((freq * i / SAMPLE_RATE) % 1) - 1);
  return out;
}
function noise(duration, amp = 1) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) out[i] = amp * (Math.random() * 2 - 1);
  return out;
}
function silence(duration) { return new Float64Array(Math.floor(SAMPLE_RATE * duration)); }

function envelope(samples, a, d, s, r) {
  const out = new Float64Array(samples.length);
  const aL = Math.floor(a * SAMPLE_RATE), dL = Math.floor(d * SAMPLE_RATE), rL = Math.floor(r * SAMPLE_RATE);
  for (let i = 0; i < samples.length; i++) {
    let g;
    if (i < aL) g = i / aL;
    else if (i < aL + dL) g = 1 - (1 - s) * ((i - aL) / dL);
    else if (i < samples.length - rL) g = s;
    else { const ri = i - (samples.length - rL); g = s * (1 - ri / rL); }
    out[i] = samples[i] * Math.max(0, g);
  }
  return out;
}

function mix(...arrs) {
  const len = Math.max(...arrs.map(a => a.length));
  const out = new Float64Array(len);
  for (const a of arrs) for (let i = 0; i < a.length; i++) out[i] += a[i];
  return out;
}
function concat(...arrs) {
  const len = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Float64Array(len);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}
function gain(s, v) { const o = new Float64Array(s.length); for (let i = 0; i < s.length; i++) o[i] = s[i] * v; return o; }
function lowpass(s, cutoff) {
  const o = new Float64Array(s.length);
  const a = (1 / (cutoff * 2 * Math.PI)) / (1 / (cutoff * 2 * Math.PI) + 1 / SAMPLE_RATE);
  o[0] = s[0];
  for (let i = 1; i < s.length; i++) o[i] = o[i-1] + (1-a) * (s[i] - o[i-1]);
  return o;
}
function highpass(s, cutoff) {
  const o = new Float64Array(s.length);
  const rc = 1 / (cutoff * 2 * Math.PI);
  const a = rc / (rc + 1 / SAMPLE_RATE);
  o[0] = s[0];
  for (let i = 1; i < s.length; i++) o[i] = a * (o[i-1] + s[i] - s[i-1]);
  return o;
}
function distort(s, amt = 2) { const o = new Float64Array(s.length); for (let i = 0; i < s.length; i++) o[i] = Math.tanh(s[i] * amt); return o; }
function reverb(s, decay = 0.3, delayMs = 50) {
  const d = Math.floor(SAMPLE_RATE * delayMs / 1000);
  const o = Float64Array.from(s);
  for (let n = 1; n <= 4; n++) { const off = d * n; const g = Math.pow(decay, n); for (let i = off; i < o.length; i++) o[i] += s[i - off] * g; }
  let mx = 0; for (let i = 0; i < o.length; i++) mx = Math.max(mx, Math.abs(o[i]));
  if (mx > 1) for (let i = 0; i < o.length; i++) o[i] /= mx;
  return o;
}
function normalize(s, t = 0.95) {
  let mx = 0; for (let i = 0; i < s.length; i++) mx = Math.max(mx, Math.abs(s[i]));
  if (mx === 0) return s;
  const o = new Float64Array(s.length);
  for (let i = 0; i < s.length; i++) o[i] = s[i] * (t / mx);
  return o;
}
function fadeIn(s, dur) { const o = Float64Array.from(s); const l = Math.floor(dur * SAMPLE_RATE); for (let i = 0; i < Math.min(l, o.length); i++) o[i] *= i / l; return o; }
function fadeOut(s, dur) { const o = Float64Array.from(s); const l = Math.floor(dur * SAMPLE_RATE); for (let i = 0; i < Math.min(l, o.length); i++) o[o.length-1-i] *= i / l; return o; }

// === Sound Generators ===

function generateHit() {
  return normalize(reverb(mix(
    envelope(lowpass(noise(0.12, 0.9), 4000), 0.001, 0.02, 0.3, 0.08),
    envelope(sine(80, 0.15, 0.8), 0.001, 0.05, 0.2, 0.08),
    envelope(highpass(noise(0.06, 0.5), 2000), 0.001, 0.01, 0.1, 0.03)
  ), 0.15, 30));
}

function generateHitHeavy() {
  return normalize(reverb(mix(
    envelope(lowpass(noise(0.2, 1.0), 2000), 0.001, 0.03, 0.4, 0.12),
    envelope(sine(50, 0.25, 0.9), 0.001, 0.08, 0.3, 0.12),
    envelope(mix(sine(1200, 0.15, 0.3), sine(1800, 0.12, 0.2)), 0.001, 0.03, 0.1, 0.08),
    envelope(distort(noise(0.04, 0.6), 3), 0.001, 0.01, 0.1, 0.02)
  ), 0.25, 40));
}

function generateCombo() {
  const freqs = [523, 659, 784, 1047];
  const parts = freqs.map((f, i) => {
    const tone = mix(sine(f, 0.12, 0.6), sine(f*2, 0.1, 0.2), saw(f, 0.1, 0.15));
    return concat(silence(i * 0.08), envelope(tone, 0.005, 0.03, 0.4, 0.05));
  });
  const sparkle = envelope(mix(sine(3000, 0.5, 0.15), sine(4000, 0.4, 0.1)), 0.01, 0.1, 0.1, 0.2);
  return normalize(reverb(mix(...parts, sparkle), 0.3, 35));
}

function generateKO() {
  const impact = envelope(lowpass(distort(noise(0.3, 1.0), 4), 1500), 0.001, 0.05, 0.5, 0.2);
  const len = Math.floor(SAMPLE_RATE * 0.8);
  const descend = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) { const t = i/len; phase += (400*Math.pow(0.15,t))/SAMPLE_RATE; descend[i] = 0.5*Math.sin(2*Math.PI*phase); }
  return normalize(reverb(mix(impact, envelope(descend, 0.01, 0.1, 0.5, 0.3), envelope(sine(40, 1.0, 0.8), 0.001, 0.2, 0.3, 0.4)), 0.35, 60));
}

function generateErro() {
  const b1 = envelope(mix(square(300, 0.15, 0.4), sine(300, 0.15, 0.3)), 0.005, 0.02, 0.8, 0.03);
  const b2 = envelope(mix(square(220, 0.2, 0.4), sine(220, 0.2, 0.3)), 0.005, 0.02, 0.8, 0.05);
  return normalize(concat(b1, silence(0.03), b2));
}

function generateCountdown(num) {
  const freq = 800 + (4 - num) * 200;
  return normalize(reverb(envelope(
    mix(sine(freq, 0.15, 0.7), sine(freq*1.5, 0.12, 0.2), sine(freq*2, 0.1, 0.1)),
    0.005, 0.02, 0.7, 0.04
  ), 0.2, 25));
}

function generateCountdownGo() {
  return normalize(reverb(mix(
    envelope(mix(sine(440, 0.6, 0.6), sine(554, 0.6, 0.5), sine(659, 0.6, 0.4), saw(440, 0.5, 0.15)), 0.01, 0.05, 0.8, 0.15),
    envelope(mix(sine(1760, 0.1, 0.4), sine(2200, 0.08, 0.3)), 0.005, 0.02, 0.3, 0.04),
    envelope(sine(110, 0.5, 0.4), 0.01, 0.1, 0.3, 0.15)
  ), 0.3, 45));
}

function generateTimeUp() {
  return normalize(reverb(envelope(
    mix(square(440, 0.8, 0.3), square(441, 0.8, 0.3), sine(440, 0.8, 0.3), sine(880, 0.7, 0.1)),
    0.01, 0.05, 0.8, 0.15
  ), 0.25, 40));
}

function generateRoundStart() {
  return normalize(reverb(mix(
    envelope(mix(sine(800, 0.8, 0.5), sine(1200, 0.6, 0.3), sine(1600, 0.4, 0.15)), 0.002, 0.08, 0.15, 0.5),
    envelope(sine(200, 0.6, 0.3), 0.01, 0.1, 0.1, 0.3)
  ), 0.4, 50));
}

function generateSpecialReady() {
  const len = Math.floor(SAMPLE_RATE * 0.6);
  const sweep = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) { const t = i/len; phase += (300+2000*t*t)/SAMPLE_RATE; sweep[i] = 0.5*Math.sin(2*Math.PI*phase); }
  return normalize(reverb(mix(
    envelope(sweep, 0.01, 0.05, 0.7, 0.15),
    envelope(mix(sine(2000, 0.6, 0.2), sine(3000, 0.5, 0.15)), 0.1, 0.1, 0.3, 0.2)
  ), 0.3, 35));
}

function generateSpecialAttack() {
  const energy = new Float64Array(Math.floor(SAMPLE_RATE * 0.5));
  let phase = 0;
  for (let i = 0; i < energy.length; i++) { const t = i/energy.length; phase += (2000*Math.pow(0.2,t))/SAMPLE_RATE; energy[i] = 0.6*Math.sin(2*Math.PI*phase)*(1-t); }
  return normalize(reverb(mix(
    envelope(distort(noise(0.15, 0.8), 2.5), 0.001, 0.02, 0.5, 0.1),
    energy,
    envelope(sine(60, 0.4, 0.7), 0.001, 0.05, 0.4, 0.2),
    envelope(highpass(noise(0.05, 0.8), 3000), 0.001, 0.01, 0.2, 0.02)
  ), 0.25, 40));
}

function generateScoreBeep() {
  return normalize(envelope(mix(sine(1200, 0.08, 0.7), sine(1800, 0.06, 0.3)), 0.003, 0.01, 0.6, 0.03));
}

function generateVictory() {
  const chords = [
    { f: [523,659,784], d: 0.25 }, { f: [587,740,880], d: 0.25 },
    { f: [659,831,988], d: 0.25 }, { f: [698,880,1047], d: 0.5 },
    { f: [784,988,1175], d: 0.8 },
  ];
  let off = 0;
  const parts = chords.map(c => {
    const tones = c.f.map(f => envelope(mix(sine(f, c.d, 0.35), saw(f, c.d*0.8, 0.08)), 0.01, 0.03, 0.7, 0.08));
    const p = concat(silence(off), mix(...tones));
    off += c.d * 0.85;
    return p;
  });
  const sparkle = concat(silence(off - 0.4), envelope(mix(sine(3000, 0.6, 0.12), sine(4000, 0.5, 0.08)), 0.05, 0.1, 0.15, 0.3));
  return normalize(reverb(mix(...parts, sparkle), 0.35, 50));
}

// === 808 SUB BASS HELPER: Sine with pitch slide (modern trap signature) ===
function bass808(startFreq, endFreq, duration, amp = 0.8) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    // Exponential pitch slide from startFreq down to endFreq
    const freq = endFreq + (startFreq - endFreq) * Math.exp(-6 * t);
    phase += freq / SAMPLE_RATE;
    // Saturated sine for that 808 warmth
    const raw = Math.sin(2 * Math.PI * phase);
    out[i] = amp * Math.tanh(raw * 1.8) * Math.max(0, 1 - t * 0.3);
  }
  return out;
}

// === TRAP HI-HAT HELPER: Creates a single hat with variable decay ===
function trapHat(duration, amp, cutoffHz = 8000) {
  return envelope(highpass(noise(duration, amp), cutoffHz), 0.0005, 0.002, 0.15, duration * 0.3);
}

// === CINEMATIC RISER: Filtered noise sweep upward ===
function cinematicRiser(duration, amp = 0.15) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    // Noise filtered with rising cutoff
    const n = (Math.random() * 2 - 1) * amp * t * t;
    // Add tonal riser
    phase += (100 + 2000 * t * t * t) / SAMPLE_RATE;
    out[i] = n * 0.6 + 0.4 * amp * t * t * Math.sin(2 * Math.PI * phase);
  }
  return lowpass(out, 200 + 6000 * 0.8);
}

// === TIME ATTACK BG: 150 BPM Modern Trap — 808s, trap hats, cinematic urgency ===
function generateBgTimeAttack() {
  const bpm = 150, beatDur = 60/bpm, bars = 14;
  const totalLen = Math.floor(SAMPLE_RATE * bars * 4 * beatDur);
  const out = new Float64Array(totalLen);

  // 808 KICK — punchy transient + sub body
  for (let b = 0; b < bars*4; b++) {
    // Kick pattern: hit on 1, skip some beats for groove
    const inBar = b % 4;
    if (inBar === 1 || inBar === 3 && b % 8 < 4) continue;
    const s = Math.floor(b * beatDur * SAMPLE_RATE);
    // Transient click
    const click = envelope(highpass(noise(0.005, 0.6), 3000), 0.0001, 0.003, 0.1, 0.003);
    // 808 body
    const body = bass808(160, 40, 0.25, 0.7);
    const k = mix(click, body);
    for (let i = 0; i < k.length && s+i < totalLen; i++) out[s+i] += k[i];
  }

  // TRAP HI-HATS — 16ths with triplet rolls on every other bar
  for (let bar = 0; bar < bars; bar++) {
    const hasTriplets = bar % 2 === 1;
    for (let step = 0; step < 16; step++) {
      const s = Math.floor((bar*4 + step * beatDur/4 * 4) * beatDur / beatDur * beatDur/4 * SAMPLE_RATE);
      const sOff = Math.floor((bar*16 + step) * beatDur/4 * SAMPLE_RATE);
      const accent = step % 4 === 0;
      const vel = accent ? 0.28 : (0.08 + 0.12 * Math.abs(Math.sin(step * 0.7 + bar)));
      const dur = accent ? 0.035 : 0.015;
      const hat = trapHat(dur, vel, accent ? 7000 : 9000);
      for (let i = 0; i < hat.length && sOff+i < totalLen; i++) out[sOff+i] += hat[i];

      // Triplet rolls on beats 3-4 of triplet bars
      if (hasTriplets && step >= 8 && step % 2 === 0) {
        const tripletGap = beatDur / 12; // triplet timing
        for (let t = 1; t <= 2; t++) {
          const ts = sOff + Math.floor(t * tripletGap * SAMPLE_RATE);
          const tHat = trapHat(0.01, 0.12 + t * 0.03, 10000);
          for (let i = 0; i < tHat.length && ts+i < totalLen; i++) out[ts+i] += tHat[i];
        }
      }
    }
  }

  // CLAP/SNARE on 2 and 4 — layered clap
  for (let b = 0; b < bars*4; b++) {
    if (b % 2 !== 1) continue;
    const s = Math.floor(b * beatDur * SAMPLE_RATE);
    const clap = envelope(mix(
      highpass(noise(0.06, 0.45), 2500),
      highpass(noise(0.04, 0.3), 4000),
      sine(200, 0.03, 0.2)
    ), 0.001, 0.01, 0.15, 0.05);
    for (let i = 0; i < clap.length && s+i < totalLen; i++) out[s+i] += clap[i];
  }

  // 808 BASS — long sustained sub notes with pitch slide
  const bassNotes = [36, 36, 41, 36, 33, 36, 41, 33]; // C1-E1-A0 dark minor
  for (let bar = 0; bar < bars; bar++) {
    const patIdx = bar % bassNotes.length;
    const freq = bassNotes[patIdx];
    // Hit on beat 1 and sometimes beat 3
    for (let hit = 0; hit < 2; hit++) {
      if (hit === 1 && bar % 3 !== 0) continue;
      const beatOff = hit * 2;
      const s = Math.floor((bar*4 + beatOff) * beatDur * SAMPLE_RATE);
      const dur = hit === 0 ? beatDur * 3.5 : beatDur * 1.5;
      const b808 = bass808(freq * 3, freq, dur, 0.65);
      for (let i = 0; i < b808.length && s+i < totalLen; i++) out[s+i] += b808[i];
    }
  }

  // CINEMATIC RISER — every 4 bars for urgency
  for (let sec = 0; sec < Math.floor(bars/4); sec++) {
    const s = Math.floor(sec * 16 * beatDur * SAMPLE_RATE);
    const riser = cinematicRiser(4 * beatDur, 0.12);
    const riserStart = s + Math.floor(12 * beatDur * SAMPLE_RATE); // last bar of each 4-bar section
    for (let i = 0; i < riser.length && riserStart+i < totalLen; i++) out[riserStart+i] += riser[i];
  }

  // DARK ATMOSPHERE — low filtered noise bed
  const atmLen = totalLen;
  const atm = new Float64Array(atmLen);
  for (let i = 0; i < atmLen; i++) {
    atm[i] = 0.04 * (Math.random() * 2 - 1);
  }
  const filtAtm = lowpass(atm, 250);
  for (let i = 0; i < atmLen; i++) out[i] += filtAtm[i];

  // SUB DROP impact on bar 1, 5, 9
  for (let drop = 0; drop < 3; drop++) {
    const s = Math.floor(drop * 4 * 4 * beatDur * SAMPLE_RATE);
    if (s >= totalLen) continue;
    const dropSound = bass808(200, 25, 0.5, 0.5);
    for (let i = 0; i < dropSound.length && s+i < totalLen; i++) out[s+i] += dropSound[i];
  }

  return normalize(fadeIn(fadeOut(out, 0.5), 0.3));
}

// === ARCADE BG: 140 BPM Dark Trap / UFC Walkout — Heavy 808s, aggressive, cinematic ===
function generateBgArcade() {
  const bpm = 140, beatDur = 60/bpm, bars = 16;
  const totalLen = Math.floor(SAMPLE_RATE * bars * 4 * beatDur);
  const out = new Float64Array(totalLen);

  // HEAVY 808 KICK — maximum impact
  const kickPattern = [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,1,0,0]; // 16-step pattern
  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < 16; step++) {
      if (!kickPattern[step % kickPattern.length]) continue;
      const s = Math.floor((bar*16 + step) * beatDur/4 * SAMPLE_RATE);
      const click = envelope(distort(highpass(noise(0.004, 0.7), 4000), 2), 0.0001, 0.002, 0.1, 0.002);
      const body = bass808(180, 35, 0.2, 0.85);
      const k = mix(click, body);
      for (let i = 0; i < k.length && s+i < totalLen; i++) out[s+i] += k[i];
    }
  }

  // TRAP HI-HATS — aggressive with fast rolls
  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < 16; step++) {
      const sOff = Math.floor((bar*16 + step) * beatDur/4 * SAMPLE_RATE);
      const accent = step % 4 === 0;
      const offbeat = step % 4 === 2;
      const vel = accent ? 0.32 : offbeat ? 0.2 : 0.1;
      const dur = accent ? 0.04 : offbeat ? 0.025 : 0.012;
      const hat = trapHat(dur, vel, 8000);
      for (let i = 0; i < hat.length && sOff+i < totalLen; i++) out[sOff+i] += hat[i];

      // Fast triplet rolls every 2 bars, last 2 beats
      if (bar % 2 === 1 && step >= 12) {
        const tripletGap = beatDur / 12;
        for (let t = 1; t <= 3; t++) {
          const ts = sOff + Math.floor(t * tripletGap * SAMPLE_RATE);
          const tHat = trapHat(0.008, 0.1 + t * 0.04, 11000);
          for (let i = 0; i < tHat.length && ts+i < totalLen; i++) out[ts+i] += tHat[i];
        }
      }
    }
  }

  // HARD CLAP on 2 and 4 — distorted, layered
  for (let b = 0; b < bars*4; b++) {
    if (b % 2 !== 1) continue;
    const s = Math.floor(b * beatDur * SAMPLE_RATE);
    const clap = envelope(distort(mix(
      highpass(noise(0.08, 0.5), 2000),
      highpass(noise(0.05, 0.35), 5000),
      sine(180, 0.04, 0.25)
    ), 1.5), 0.001, 0.012, 0.2, 0.06);
    for (let i = 0; i < clap.length && s+i < totalLen; i++) out[s+i] += clap[i];
  }

  // HEAVY 808 BASS — long sustained, dark, distorted
  const bassPattern808 = [33, 33, 37, 33, 31, 33, 37, 31]; // A0 C1 B0 — dark and heavy
  for (let bar = 0; bar < bars; bar++) {
    const freq = bassPattern808[bar % bassPattern808.length];
    const s = Math.floor(bar * 4 * beatDur * SAMPLE_RATE);
    const dur = 4 * beatDur * 0.9;
    const b808 = bass808(freq * 4, freq, dur, 0.75);
    // Add subtle distortion for grit
    const dist808 = distort(b808, 1.3);
    for (let i = 0; i < dist808.length && s+i < totalLen; i++) out[s+i] += dist808[i] * 0.6;
  }

  // CINEMATIC IMPACTS — every 4 bars
  for (let sec = 0; sec < Math.floor(bars/4); sec++) {
    const s = Math.floor(sec * 16 * beatDur * SAMPLE_RATE);
    // Sub-heavy impact
    const impact = mix(
      bass808(300, 20, 0.6, 0.6),
      envelope(lowpass(distort(noise(0.15, 0.7), 3), 600), 0.001, 0.02, 0.2, 0.12)
    );
    for (let i = 0; i < impact.length && s+i < totalLen; i++) out[s+i] += impact[i];
  }

  // CINEMATIC RISERS — build tension before each 4-bar drop
  for (let sec = 0; sec < Math.floor(bars/4); sec++) {
    const riserStart = Math.floor((sec * 16 + 12) * beatDur * SAMPLE_RATE); // last bar
    const riser = cinematicRiser(4 * beatDur, 0.15);
    for (let i = 0; i < riser.length && riserStart+i < totalLen; i++) out[riserStart+i] += riser[i];
  }

  // DARK PAD — very low, filtered, ominous
  for (let bar = 0; bar < bars; bar += 4) {
    const s = Math.floor(bar * 4 * beatDur * SAMPLE_RATE);
    const padDur = 16 * beatDur;
    const padLen = Math.floor(SAMPLE_RATE * padDur);
    const pad = new Float64Array(padLen);
    const baseFreq = bar % 8 === 0 ? 55 : 49; // A1 / G1
    for (let i = 0; i < padLen; i++) {
      const t = i / padLen;
      const env = Math.sin(Math.PI * t) * 0.1;
      pad[i] = env * (
        Math.sin(2 * Math.PI * baseFreq * i / SAMPLE_RATE) +
        0.5 * Math.sin(2 * Math.PI * baseFreq * 1.5 * i / SAMPLE_RATE) +
        0.3 * Math.sin(2 * Math.PI * baseFreq * 2 * i / SAMPLE_RATE)
      );
    }
    const filtPad = lowpass(pad, 400);
    for (let i = 0; i < filtPad.length && s+i < totalLen; i++) out[s+i] += filtPad[i];
  }

  // DARK ATMOSPHERE NOISE BED
  const atmNoise = new Float64Array(totalLen);
  for (let i = 0; i < totalLen; i++) atmNoise[i] = 0.035 * (Math.random() * 2 - 1);
  const filtAtm = lowpass(atmNoise, 200);
  for (let i = 0; i < totalLen; i++) out[i] += filtAtm[i];

  return normalize(fadeIn(fadeOut(out, 0.5), 0.3));
}

// === REACTION BG: 130 BPM Minimal Trap — Nike Training Montage feel, focused, clean ===
function generateBgReaction() {
  const bpm = 130, beatDur = 60/bpm, bars = 16;
  const totalLen = Math.floor(SAMPLE_RATE * bars * 4 * beatDur);
  const out = new Float64Array(totalLen);

  // CLEAN 808 KICK — sparse, minimal pattern
  for (let bar = 0; bar < bars; bar++) {
    // Only hit on beat 1, and sometimes beat 3.5 for groove
    const s1 = Math.floor(bar * 4 * beatDur * SAMPLE_RATE);
    const click1 = envelope(highpass(noise(0.003, 0.4), 4000), 0.0001, 0.002, 0.1, 0.002);
    const body1 = bass808(120, 42, 0.2, 0.55);
    const k1 = mix(click1, body1);
    for (let i = 0; i < k1.length && s1+i < totalLen; i++) out[s1+i] += k1[i];

    if (bar % 2 === 0) {
      const s2 = Math.floor((bar * 4 + 2.75) * beatDur * SAMPLE_RATE);
      const body2 = bass808(100, 42, 0.15, 0.4);
      for (let i = 0; i < body2.length && s2+i < totalLen; i++) out[s2+i] += body2[i];
    }
  }

  // MINIMAL TRAP HI-HATS — sparse, clean
  for (let bar = 0; bar < bars; bar++) {
    // Sparse pattern: not every 16th, just key positions
    const hatSteps = [0, 4, 6, 8, 10, 12, 14]; // selected 16th positions
    for (const step of hatSteps) {
      const sOff = Math.floor((bar*16 + step) * beatDur/4 * SAMPLE_RATE);
      const accent = step === 0 || step === 8;
      const vel = accent ? 0.22 : 0.1;
      const dur = accent ? 0.03 : 0.015;
      const hat = trapHat(dur, vel, accent ? 7500 : 10000);
      for (let i = 0; i < hat.length && sOff+i < totalLen; i++) out[sOff+i] += hat[i];
    }

    // Subtle triplet roll every 4 bars on last beat
    if (bar % 4 === 3) {
      const rollStart = Math.floor((bar*16 + 14) * beatDur/4 * SAMPLE_RATE);
      const tripletGap = beatDur / 12;
      for (let t = 0; t < 4; t++) {
        const ts = rollStart + Math.floor(t * tripletGap * SAMPLE_RATE);
        const tHat = trapHat(0.01, 0.08 + t * 0.02, 10000);
        for (let i = 0; i < tHat.length && ts+i < totalLen; i++) out[ts+i] += tHat[i];
      }
    }
  }

  // SOFT CLAP on 2 and 4 — cleaner than arcade
  for (let b = 0; b < bars*4; b++) {
    if (b % 2 !== 1) continue;
    const s = Math.floor(b * beatDur * SAMPLE_RATE);
    const clap = envelope(mix(
      highpass(noise(0.04, 0.3), 3000),
      highpass(noise(0.03, 0.2), 6000)
    ), 0.001, 0.008, 0.12, 0.04);
    for (let i = 0; i < clap.length && s+i < totalLen; i++) out[s+i] += clap[i];
  }

  // CLEAN 808 BASS — minimal, sustained sub notes
  const bassNotes = [41, 41, 37, 41, 44, 41, 37, 33]; // E1 range, minor feel
  for (let bar = 0; bar < bars; bar++) {
    const freq = bassNotes[bar % bassNotes.length];
    const s = Math.floor(bar * 4 * beatDur * SAMPLE_RATE);
    const dur = 4 * beatDur * 0.8;
    const b808 = bass808(freq * 2.5, freq, dur, 0.5);
    for (let i = 0; i < b808.length && s+i < totalLen; i++) out[s+i] += b808[i];
  }

  // ATMOSPHERIC PAD — dark, modern, minimal
  for (let bar = 0; bar < bars; bar += 4) {
    const s = Math.floor(bar * 4 * beatDur * SAMPLE_RATE);
    const padDur = 16 * beatDur;
    const padLen = Math.floor(SAMPLE_RATE * padDur);
    const pad = new Float64Array(padLen);
    const baseFreq = [65.4, 61.7, 58.3, 65.4][Math.floor(bar/4) % 4]; // C2-Bb1 range
    for (let i = 0; i < padLen; i++) {
      const t = i / padLen;
      const env = Math.sin(Math.PI * t) * 0.08;
      pad[i] = env * (
        Math.sin(2 * Math.PI * baseFreq * i / SAMPLE_RATE) +
        0.4 * Math.sin(2 * Math.PI * baseFreq * 1.498 * i / SAMPLE_RATE) + // detuned fifth
        0.3 * Math.sin(2 * Math.PI * baseFreq * 2.003 * i / SAMPLE_RATE)   // detuned octave
      );
    }
    const filtPad = lowpass(pad, 600);
    for (let i = 0; i < filtPad.length && s+i < totalLen; i++) out[s+i] += filtPad[i];
  }

  // SUBTLE RISER — every 8 bars, gentle tension build
  for (let sec = 0; sec < Math.floor(bars/8); sec++) {
    const riserStart = Math.floor((sec * 32 + 28) * beatDur * SAMPLE_RATE);
    const riser = cinematicRiser(4 * beatDur, 0.08);
    for (let i = 0; i < riser.length && riserStart+i < totalLen; i++) out[riserStart+i] += riser[i];
  }

  // MINIMAL DARK AMBIENCE
  const atmNoise = new Float64Array(totalLen);
  for (let i = 0; i < totalLen; i++) {
    const t = i / totalLen;
    atmNoise[i] = 0.025 * (Math.random() * 2 - 1) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 0.05 * t * totalLen / SAMPLE_RATE));
  }
  const filtAtm = lowpass(atmNoise, 300);
  for (let i = 0; i < totalLen; i++) out[i] += filtAtm[i];

  return normalize(fadeIn(fadeOut(out, 0.8), 0.5), 0.9);
}

// Legacy alias
function generateFightModeBg() { return generateBgArcade(); }

// === Generate ===
const sounds = {
  'hit.wav': generateHit, 'hit-heavy.wav': generateHitHeavy, 'combo.wav': generateCombo,
  'ko.wav': generateKO, 'erro.wav': generateErro,
  'countdown-3.wav': () => generateCountdown(3), 'countdown-2.wav': () => generateCountdown(2),
  'countdown-1.wav': () => generateCountdown(1), 'countdown-go.wav': generateCountdownGo,
  'time-up.wav': generateTimeUp, 'round-start.wav': generateRoundStart,
  'special-ready.wav': generateSpecialReady, 'special-attack.wav': generateSpecialAttack,
  'score-beep.wav': generateScoreBeep, 'victory.wav': generateVictory,
  // BG music: now uses real MP3 files in public/sounds/ (not generated)
};

console.log('Generating sounds...\n');
for (const [file, gen] of Object.entries(sounds)) {
  try {
    const s = gen();
    const wav = createWav(Array.from(s));
    fs.writeFileSync(path.join(OUTPUT_DIR, file), wav);
    console.log(`  OK ${file} (${(s.length/SAMPLE_RATE).toFixed(2)}s)`);
  } catch (e) { console.error(`  FAIL ${file}: ${e.message}`); }
}

// Verify first file
const buf = fs.readFileSync(path.join(OUTPUT_DIR, 'hit.wav'));
console.log(`\nVerify hit.wav: BitsPerSample=${buf.readUInt16LE(34)}, SampleRate=${buf.readUInt32LE(24)}, BlockAlign=${buf.readUInt16LE(32)}`);
console.log('Done!');
