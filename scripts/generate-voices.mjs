import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = path.join(__dirname, '..', 'public', 'sounds');

const API_KEY = 'sk_f70b81e9129b8fa04649ef4385d90926ba6b4c5c12dc3e61';

// Adam voice (deep male) — great for announcements
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB';

const VOICE_LINES = [
  // Countdown
  { file: 'voice-3.mp3', text: 'Tr\u00eas!' },
  { file: 'voice-2.mp3', text: 'Dois!' },
  { file: 'voice-1.mp3', text: 'Um!' },
  { file: 'voice-fight.mp3', text: 'FIGHT!' },

  // Frenzy Zone
  { file: 'voice-frenzy.mp3', text: 'FRENZY ZONE! Pontos dobrados!' },

  // KO & Victory
  { file: 'voice-ko.mp3', text: 'KNOCK OUT!' },
  { file: 'voice-victory-red.mp3', text: 'Vit\u00f3ria do Vermelho!' },
  { file: 'voice-victory-blue.mp3', text: 'Vit\u00f3ria do Azul!' },
  { file: 'voice-empate.mp3', text: 'Empate!' },

  // Time up
  { file: 'voice-tempo.mp3', text: 'TEMPO!' },

  // Rounds
  { file: 'voice-round1.mp3', text: 'Round Um! FIGHT!' },
  { file: 'voice-round2.mp3', text: 'Round Dois! FIGHT!' },
  { file: 'voice-round3.mp3', text: 'Round Tr\u00eas! FIGHT!' },

  // Game modes
  { file: 'voice-contra-tempo.mp3', text: 'Contra o Tempo!' },
  { file: 'voice-duelo.mp3', text: 'DUELO!' },
  { file: 'voice-reacao.mp3', text: 'Centro de Treinamento! Modo Rea\u00e7\u00e3o!' },

  // Reaction
  { file: 'voice-reagir.mp3', text: 'Reagir!' },
  { file: 'voice-falta.mp3', text: 'FALTA!' },

  // General
  { file: 'voice-novo-recorde.mp3', text: 'NOVO RECORDE!' },
  { file: 'voice-preparar.mp3', text: 'Preparar!' },
];

async function generateVoice(text, outputFile) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.9,
        style: 0.85,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`FAILED [${outputFile}]: ${res.status} - ${err}`);
    return false;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const outputPath = path.join(SOUNDS_DIR, outputFile);
  fs.writeFileSync(outputPath, buffer);
  console.log(`OK [${outputFile}] "${text}" -> ${buffer.length} bytes`);
  return true;
}

async function main() {
  console.log(`Generating ${VOICE_LINES.length} voice lines...`);
  console.log(`Output: ${SOUNDS_DIR}\n`);

  let success = 0;
  let failed = 0;

  for (const line of VOICE_LINES) {
    const ok = await generateVoice(line.text, line.file);
    if (ok) success++;
    else failed++;
    // Rate limit: wait 500ms between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! ${success} generated, ${failed} failed.`);
}

main().catch(console.error);
