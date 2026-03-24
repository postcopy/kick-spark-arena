import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = path.join(__dirname, '..', 'public', 'sounds');

const API_KEY = 'sk_f70b81e9129b8fa04649ef4385d90926ba6b4c5c12dc3e61';

async function generateSFX(prompt, duration, filename) {
  console.log(`Generating: ${filename} — "${prompt.substring(0, 60)}..."`);

  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: duration,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  FAILED: ${res.status} — ${err.substring(0, 200)}`);
    return false;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(SOUNDS_DIR, filename), buffer);
  console.log(`  OK: ${buffer.length} bytes -> ${filename}`);
  return true;
}

async function main() {
  // Test 3 variations of hit sound — louder, more present
  await generateSFX(
    'loud powerful martial arts kick impact on heavy leather bag, punchy bass thud, close mic, loud and present, competition arena',
    0.5,
    'test_hit_v2.mp3'
  );

  // Wait for rate limit
  await new Promise(r => setTimeout(r, 1000));

  // Test a countdown "GO" buzzer — arcade style
  await generateSFX(
    'loud arcade game start buzzer, electronic horn blast, stadium air horn, very loud and punchy, 200 milliseconds',
    1.0,
    'test_go_buzzer.mp3'
  );

  await new Promise(r => setTimeout(r, 1000));

  // Test a KO impact — dramatic
  await generateSFX(
    'massive knockout punch impact with crowd roar, explosive bass hit with reverb tail, MMA fight knockout sound, very loud cinematic impact',
    2.0,
    'test_ko_v2.mp3'
  );

  console.log('\nDone! Listen to all 3 test files and tell me which style you prefer.');
}

main().catch(console.error);
