import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = path.join(__dirname, '..', 'public', 'sounds');

const API_KEY = 'sk_f70b81e9129b8fa04649ef4385d90926ba6b4c5c12dc3e61';

async function gen(prompt, duration, filename) {
  console.log(`Generating: ${filename}`);
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: prompt, duration_seconds: duration }),
  });
  if (!res.ok) { console.error(`  FAILED: ${res.status} ${await res.text()}`); return; }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(SOUNDS_DIR, filename), buffer);
  console.log(`  OK: ${buffer.length} bytes`);
  await new Promise(r => setTimeout(r, 1200));
}

async function main() {
  console.log('=== S-FIGHT PRO Sound Identity Test ===\n');
  console.log('3 direcoes sonoras para voce escolher:\n');

  // DIRECTION A: "Esports Arena" — eletronico, limpo, futurista
  console.log('--- DIRECTION A: Esports Arena (futurista, limpo) ---');
  await gen(
    'futuristic esports UI confirmation sound, clean digital synth note with subtle reverb, modern and sleek, medium volume',
    0.8,
    'identity-A-hit.mp3'
  );
  await gen(
    'futuristic esports countdown beep, clean digital tone descending pitch, modern UI sound, medium volume',
    1.5,
    'identity-A-countdown.mp3'
  );
  await gen(
    'futuristic esports victory fanfare, short ascending synth melody, triumphant but clean, digital production, 2 seconds',
    2.5,
    'identity-A-victory.mp3'
  );

  // DIRECTION B: "Fight Night" — organico, impacto, arena de luta
  console.log('\n--- DIRECTION B: Fight Night (organico, arena de luta) ---');
  await gen(
    'martial arts dojo wooden block hit, sharp taiko drum single strike, organic combat sound, punchy and warm, medium volume',
    0.5,
    'identity-B-hit.mp3'
  );
  await gen(
    'boxing ring bell, three clean metallic dings, classic fight countdown, warm and present, not too loud',
    2.0,
    'identity-B-countdown.mp3'
  );
  await gen(
    'martial arts tournament victory gong with crowd cheering, epic but not overwhelming, warm reverb, 2 seconds',
    2.5,
    'identity-B-victory.mp3'
  );

  // DIRECTION C: "Hybrid" — mistura eletronico + organico (taiko + synth)
  console.log('\n--- DIRECTION C: Hybrid (taiko + synth, o melhor dos dois) ---');
  await gen(
    'hybrid taiko drum hit with electronic sub bass layer, punchy martial arts impact, modern production, clean and powerful, medium volume',
    0.5,
    'identity-C-hit.mp3'
  );
  await gen(
    'hybrid electronic countdown with subtle taiko percussion, three descending tones, modern martial arts game, clean production',
    2.0,
    'identity-C-countdown.mp3'
  );
  await gen(
    'hybrid victory sound with taiko drums and electronic synth melody, short triumphant martial arts fanfare, modern and epic, 2 seconds',
    2.5,
    'identity-C-victory.mp3'
  );

  console.log('\n=== Done! 9 test files generated ===');
  console.log('Ouve cada direcao (A, B, C) e me diz qual combina mais com o S-FIGHT PRO.');
  console.log('Posso misturar elementos tambem (ex: hit do B + victory do C).');
}

main().catch(console.error);
