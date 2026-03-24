import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = path.join(__dirname, '..', 'public', 'sounds');
const API_KEY = 'sk_f70b81e9129b8fa04649ef4385d90926ba6b4c5c12dc3e61';

async function gen(prompt, duration, filename) {
  process.stdout.write(`  GEN: ${filename}...`);
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: prompt, duration_seconds: duration }),
  });
  if (!res.ok) { console.log(` FAILED (${res.status})`); return; }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(SOUNDS_DIR, filename), buffer);
  console.log(` OK (${buffer.length} bytes)`);
  await new Promise(r => setTimeout(r, 1200));
}

async function main() {
  console.log('Generating Apple-quality UI sounds...\n');

  // 3 variations to choose from
  await gen(
    'Apple iOS notification style, single pure crystal glass tap, minimal and elegant, very short, premium quality, like iPhone lock sound',
    0.5,
    'sfx-mode-select-v2a.mp3'
  );

  await gen(
    'Premium UI selection sound like Apple Watch haptic feedback as audio, soft crystalline ping, minimal elegant modern, single clean note, high quality',
    0.5,
    'sfx-mode-select-v2b.mp3'
  );

  await gen(
    'macOS Sonoma system sound style, subtle glass tap with tiny resonance, ultra clean and minimal, premium tech product confirmation, single note',
    0.5,
    'sfx-mode-select-v2c.mp3'
  );

  console.log('\nDone! Listen to all 3 and pick your favorite.');
}

main().catch(console.error);
