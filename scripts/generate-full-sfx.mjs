import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = path.join(__dirname, '..', 'public', 'sounds');

const API_KEY = process.env.ELEVENLABS_API_KEY;

async function gen(prompt, duration, filename) {
  const outputPath = path.join(SOUNDS_DIR, filename);
  // Skip if already exists (resume capability)
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
    console.log(`  SKIP: ${filename} (already exists)`);
    return true;
  }
  process.stdout.write(`  GEN: ${filename}...`);
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: prompt, duration_seconds: duration }),
  });
  if (!res.ok) {
    console.log(` FAILED (${res.status})`);
    return false;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(` OK (${buffer.length} bytes)`);
  await new Promise(r => setTimeout(r, 1200));
  return true;
}

async function main() {
  console.log('=== S-FIGHT PRO — Full Sound Pack ===');
  console.log(`Identity: A (esports synth) + C (hybrid taiko+synth)\n`);

  // ─── COMBAT IMPACTS (Direction C: hybrid taiko+synth) ───
  console.log('[ COMBAT IMPACTS ]');
  await gen(
    'hybrid taiko drum hit with electronic sub bass layer, punchy martial arts kick impact, modern production, clean and powerful, medium volume',
    0.5,
    'sfx-hit.mp3'
  );
  await gen(
    'heavy hybrid taiko drum double hit with deep electronic bass, powerful martial arts head kick impact, cinematic, louder than normal hit, medium-high volume',
    0.7,
    'sfx-hit-heavy.mp3'
  );
  await gen(
    'massive taiko drum hit with electronic distortion and crowd gasp, knockout punch impact, cinematic bass drop, dramatic and final, 1 second',
    1.5,
    'sfx-ko.mp3'
  );
  await gen(
    'rapid triple taiko drum hits ascending pitch with electronic glitch accents, martial arts combo hit sequence, fast and energetic',
    1.0,
    'sfx-combo.mp3'
  );

  // ─── COUNTDOWN (Direction A: esports synth) ───
  console.log('\n[ COUNTDOWN ]');
  await gen(
    'single clean digital esports countdown beep, descending tone, futuristic UI sound, medium volume, 300 milliseconds',
    0.5,
    'sfx-countdown-3.mp3'
  );
  await gen(
    'single clean digital esports countdown beep, mid tone, futuristic UI sound, medium volume, 300 milliseconds',
    0.5,
    'sfx-countdown-2.mp3'
  );
  await gen(
    'single clean digital esports countdown beep, higher tone, futuristic UI sound, slightly louder, 300 milliseconds',
    0.5,
    'sfx-countdown-1.mp3'
  );
  await gen(
    'esports game start signal, bright ascending synth chord with subtle bass drop, energetic and exciting, clean production, GO signal',
    1.5,
    'sfx-countdown-go.mp3'
  );

  // ─── ROUND TRANSITIONS (A+C mix) ───
  console.log('\n[ ROUND TRANSITIONS ]');
  await gen(
    'esports round start sound, hybrid taiko hit with ascending synth arpeggio, martial arts tournament round bell, modern and clean',
    1.5,
    'sfx-round-start.mp3'
  );
  await gen(
    'esports round end buzzer, clean electronic double tone descending, game pause sound, not harsh, medium volume',
    1.0,
    'sfx-round-end.mp3'
  );

  // ─── VICTORY & RESULTS (Direction A: esports) ───
  console.log('\n[ VICTORY & RESULTS ]');
  await gen(
    'esports victory fanfare, triumphant ascending synth melody with subtle percussion, short and exciting, modern game win sound, 2 seconds',
    2.5,
    'sfx-victory.mp3'
  );
  await gen(
    'esports new record achievement sound, bright sparkling synth with ascending tones, celebratory digital chime, exciting, 1.5 seconds',
    2.0,
    'sfx-new-record.mp3'
  );
  await gen(
    'game draw tie result sound, neutral electronic chord, neither happy nor sad, resolving tone, clean synth, 1 second',
    1.5,
    'sfx-tie.mp3'
  );

  // ─── FRENZY ZONE (C: hybrid, high energy) ───
  console.log('\n[ FRENZY ZONE ]');
  await gen(
    'power up activation sound, ascending hybrid synth with taiko drum roll, martial arts energy boost, exciting and fast, esports fever mode activation',
    2.0,
    'sfx-frenzy-activate.mp3'
  );
  await gen(
    'frenzy mode score point, quick bright electronic ding with subtle bass, double point reward sound, satisfying, short',
    0.4,
    'sfx-frenzy-point.mp3'
  );

  // ─── UI FEEDBACK (Direction A: esports, subtle) ───
  console.log('\n[ UI FEEDBACK ]');
  await gen(
    'clean digital UI click, soft electronic confirmation beep, modern app interface sound, subtle and pleasant, 200 milliseconds',
    0.3,
    'sfx-ui-click.mp3'
  );
  await gen(
    'soft electronic error buzz, gentle wrong answer sound, not harsh or annoying, subtle digital rejection tone, 300 milliseconds',
    0.5,
    'sfx-error.mp3'
  );
  await gen(
    'digital score increment beep, clean bright electronic pip, quick and satisfying, point awarded sound, 150 milliseconds',
    0.3,
    'sfx-score-beep.mp3'
  );

  // ─── REACTION MODE (A: esports, clean stimuli) ───
  console.log('\n[ REACTION MODE ]');
  await gen(
    'clean bright electronic stimulus beep, sharp digital tone for reaction test, clear and distinct, not startling, medium volume, 200ms',
    0.4,
    'sfx-stimulus.mp3'
  );
  await gen(
    'soft positive chime, correct answer reward sound, gentle ascending two notes, digital and pleasant, 300ms',
    0.5,
    'sfx-correct.mp3'
  );
  await gen(
    'wrong answer buzz, short electronic fault sound, not harsh, gentle red card buzzer, 300ms',
    0.5,
    'sfx-fault.mp3'
  );

  // ─── TIMER WARNINGS (A: esports) ───
  console.log('\n[ TIMER WARNINGS ]');
  await gen(
    'electronic timer warning, subtle pulsing low tone, time running out alert, not alarming but urgent, clean synth, 1 second',
    1.0,
    'sfx-time-warning.mp3'
  );
  await gen(
    'electronic timer expired, final buzzer clean tone, time is up sound, definitive but not harsh, medium volume, 1 second',
    1.5,
    'sfx-time-up.mp3'
  );

  // ─── SPECIAL (C: hybrid epic) ───
  console.log('\n[ SPECIAL ]');
  await gen(
    'martial arts ready stance sound, hybrid taiko with electronic tension drone, fighter preparing, anticipation building, 1 second',
    1.5,
    'sfx-ready.mp3'
  );

  console.log('\n=== DONE! Full S-FIGHT PRO sound pack generated ===');

  // List all generated files
  const files = fs.readdirSync(SOUNDS_DIR).filter(f => f.startsWith('sfx-')).sort();
  console.log(`\n${files.length} sound files:`);
  files.forEach(f => {
    const size = fs.statSync(path.join(SOUNDS_DIR, f)).size;
    console.log(`  ${f.padEnd(30)} ${(size / 1024).toFixed(1)} KB`);
  });
}

main().catch(console.error);
