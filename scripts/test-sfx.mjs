import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '..', 'public', 'sounds', 'test_hit.mp3');

const API_KEY = process.env.ELEVENLABS_API_KEY;

async function main() {
  console.log('Testing ElevenLabs Sound Generation API...');

  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: 'short punchy martial arts kick impact on padded target, dry, 100 milliseconds',
      duration_seconds: 0.5,
    }),
  });

  console.log(`Status: ${res.status} ${res.statusText}`);
  console.log(`Content-Type: ${res.headers.get('content-type')}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`Response size: ${buffer.length} bytes`);

  if (buffer.length < 1000) {
    console.log('SMALL RESPONSE — likely error. Content:');
    console.log(buffer.toString('utf-8'));
    return;
  }

  fs.writeFileSync(outputPath, buffer);
  console.log(`SUCCESS! Saved to: ${outputPath}`);
}

main().catch(console.error);
