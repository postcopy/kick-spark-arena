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
  console.log('Generating failed sounds (min 0.5s duration)...\n');

  // Failed with 0.4s/0.3s — increase to 0.5s minimum
  await gen(
    'quick bright electronic double ding with subtle bass, double point reward sound, satisfying frenzy bonus, esports power up collect',
    0.5,
    'sfx-frenzy-point.mp3'
  );
  await gen(
    'clean soft digital UI click sound, modern app button press, subtle electronic confirmation, pleasant',
    0.5,
    'sfx-ui-click.mp3'
  );
  await gen(
    'digital score point beep, clean bright electronic pip, quick and satisfying, arcade point awarded notification',
    0.5,
    'sfx-score-beep.mp3'
  );
  await gen(
    'clean bright electronic stimulus ping for reaction test, sharp digital alert tone, clear and distinct, not startling, game ready signal',
    0.5,
    'sfx-stimulus.mp3'
  );

  // BONUS: Navigation/page sounds
  console.log('\n[ PAGE NAVIGATION & BUTTONS ]');
  await gen(
    'soft futuristic UI navigation swoosh, gentle digital page transition sound, modern app screen change, subtle and smooth',
    0.5,
    'sfx-nav-swoosh.mp3'
  );
  await gen(
    'modern UI button hover sound, very subtle electronic tick, soft digital feedback, barely audible but present',
    0.5,
    'sfx-btn-hover.mp3'
  );
  await gen(
    'esports mode selection confirm, digital lock-in sound with subtle bass, character select confirmation, satisfying click',
    0.8,
    'sfx-mode-select.mp3'
  );
  await gen(
    'USB hardware connected notification, positive electronic ascending two-note chime, device paired successfully, clean and modern',
    1.0,
    'sfx-usb-connected.mp3'
  );
  await gen(
    'USB hardware disconnected notification, gentle descending two-note electronic tone, device unpaired, subtle warning',
    0.8,
    'sfx-usb-disconnected.mp3'
  );
  await gen(
    'login success welcome chime, warm ascending synth notes, account authenticated, friendly and professional, 1 second',
    1.0,
    'sfx-login-success.mp3'
  );

  console.log('\nDone!');
  const files = fs.readdirSync(SOUNDS_DIR).filter(f => f.startsWith('sfx-')).sort();
  console.log(`Total: ${files.length} sound files`);
}

main().catch(console.error);
