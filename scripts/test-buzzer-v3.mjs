import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = path.join(__dirname, '..', 'public', 'sounds');

const API_KEY = process.env.ELEVENLABS_API_KEY;

async function generateSFX(prompt, duration, filename) {
  console.log(`Generating: ${filename}`);
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: prompt, duration_seconds: duration }),
  });
  if (!res.ok) { console.error(`  FAILED: ${res.status}`); return; }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(SOUNDS_DIR, filename), buffer);
  console.log(`  OK: ${buffer.length} bytes`);
}

async function main() {
  // Buzzer v3 — softer, more like a clean electronic tone, not a stadium horn
  await generateSFX(
    'clean electronic game start tone, soft two-note ascending chime, digital beep, medium volume, smooth and pleasant, not harsh',
    1.0,
    'test_go_buzzer_v3.mp3'
  );

  console.log('\nDone! Compare with the previous buzzer.');
}

main().catch(console.error);
