const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

function getElevenLabsConfig() {
  let apiKey = process.env.ELEVENLABS_API_KEY;
  let voiceId = process.env.ELEVENLABS_VOICE_ID;

  // Check local .env if present
  const localEnv = path.join(__dirname, '../.env');
  if ((!apiKey || !voiceId) && fs.existsSync(localEnv)) {
    const content = fs.readFileSync(localEnv, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('ELEVENLABS_API_KEY=')) {
        apiKey = apiKey || trimmed.substring('ELEVENLABS_API_KEY='.length).replace(/["']/g, '').trim();
      }
      if (trimmed.startsWith('ELEVENLABS_VOICE_ID=')) {
        voiceId = voiceId || trimmed.substring('ELEVENLABS_VOICE_ID='.length).replace(/["']/g, '').trim();
      }
    }
  }

  // Optional custom environment file path via ELEVENLABS_ENV_FILE
  const userEnv = process.env.ELEVENLABS_ENV_FILE;
  if ((!apiKey || !voiceId) && userEnv && fs.existsSync(userEnv)) {
    const content = fs.readFileSync(userEnv, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('ELEVENLABS_API_KEY=')) {
        apiKey = apiKey || trimmed.substring('ELEVENLABS_API_KEY='.length).replace(/["']/g, '').trim();
      }
      if (trimmed.startsWith('ELEVENLABS_VOICE_ID=')) {
        voiceId = voiceId || trimmed.substring('ELEVENLABS_VOICE_ID='.length).replace(/["']/g, '').trim();
      }
    }
  }

  if (!apiKey || !voiceId) {
    throw new Error('ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be set in environment variables (or specify ELEVENLABS_ENV_FILE).');
  }

  return { apiKey, voiceId };
}

function formatSrtTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const pad = (num, size) => String(num).padStart(size, '0');
  return `${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)},${pad(millis, 3)}`;
}

function buildSrtFromAlignment(alignment, originalText) {
  const chars = alignment.characters;
  const startTimes = alignment.character_start_times_seconds;
  const endTimes = alignment.character_end_times_seconds;

  // Split original text into coherent caption segments based on punctuation and paragraph breaks
  const rawSegments = [
    "Commerce moves across worlds.",
    "Old ledgers and new chains.",
    "Regulated rails and decentralized networks.",
    "For modern merchants, accepting value across fragmented financial systems has always meant friction—",
    "juggling disparate custody models, currency volatility, and incompatible rails.",
    "Meet CheetahPay Shield.",
    "In our merchant suite, creating a payment request is standard, intuitive, and native to Zcash.",
    "The system transparently classifies receiver capabilities—",
    "alerting users to public address exposure while unlocking the power of shielded Unified pools.",
    "Checkout is orchestrated via the ZIP-321 standard.",
    "Customers scan an offline, client-side vector QR code or dispatch directly to their personal wallet.",
    "The invoice reference is bound securely into the memo—",
    "formatting payment parameters without touching private keys.",
    "When verifying payments, CheetahPay enforces strict technical honesty.",
    "On-chain block inclusion is confirmed through live testnet telemetry,",
    "while shielded note plaintexts remain protected until decrypted by the merchant's private wallet.",
    "From unified cross-rail transaction auditing to illustrative onboarding estimators,",
    "every interaction is built fail-closed, non-custodial, and verifiable.",
    "One seamless payment experience, bridging disparate financial worlds.",
    "CheetahPay Shield.",
    "Pay fiat to Web3. Pay crypto to Web2."
  ];

  let charIndex = 0;
  const srtEntries = [];

  for (let sIdx = 0; sIdx < rawSegments.length; sIdx++) {
    const targetText = rawSegments[sIdx].trim();
    if (!targetText) continue;

    // Find the matching start character index in the characters array
    const firstChar = targetText[0];
    while (charIndex < chars.length && chars[charIndex] !== firstChar) {
      charIndex++;
    }

    const segStartTime = startTimes[charIndex] || 0;
    
    // Advance charIndex through the length of targetText
    let matchedChars = 0;
    let segEndTime = segStartTime + 1.0;

    while (charIndex < chars.length && matchedChars < targetText.length) {
      if (chars[charIndex] === targetText[matchedChars]) {
        matchedChars++;
        segEndTime = endTimes[charIndex] || segEndTime;
      }
      charIndex++;
    }

    srtEntries.push({
      index: srtEntries.length + 1,
      start: segStartTime,
      end: segEndTime,
      text: targetText
    });
  }

  // Format into SRT string
  return srtEntries.map(e => {
    return `${e.index}\n${formatSrtTime(e.start)} --> ${formatSrtTime(e.end)}\n${e.text}\n`;
  }).join('\n');
}

async function generateWithTimestamps(text, outMp3Path, outSrtPath) {
  const { apiKey, voiceId } = getElevenLabsConfig();

  const payload = JSON.stringify({
    text: text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.52,
      similarity_boost: 0.80,
      style: 0.12,
      use_speaker_boost: true
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      port: 443,
      path: `/v1/text-to-speech/${voiceId}/with-timestamps`,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`ElevenLabs API HTTP ${res.statusCode}: ${body.slice(0, 300)}`));
        }

        try {
          const data = JSON.parse(body);
          if (!data.audio_base64) {
            return reject(new Error('Missing audio_base64 in ElevenLabs response'));
          }

          // Save audio buffer
          const audioBuffer = Buffer.from(data.audio_base64, 'base64');
          fs.writeFileSync(outMp3Path, audioBuffer);
          console.log(`Saved MP3: ${outMp3Path} (${audioBuffer.length} bytes)`);

          // Generate SRT from alignment
          if (data.alignment) {
            const srtContent = buildSrtFromAlignment(data.alignment, text);
            fs.writeFileSync(outSrtPath, srtContent, 'utf8');
            console.log(`Saved SRT: ${outSrtPath}`);
          }

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const masterScript = `Commerce moves across worlds.
Old ledgers and new chains. Regulated rails and decentralized networks.

For modern merchants, accepting value across fragmented financial systems has always meant friction—juggling disparate custody models, currency volatility, and incompatible rails.

Meet CheetahPay Shield.

In our merchant suite, creating a payment request is standard, intuitive, and native to Zcash. The system transparently classifies receiver capabilities—alerting users to public address exposure while unlocking the power of shielded Unified pools.

Checkout is orchestrated via the ZIP-321 standard. Customers scan an offline, client-side vector QR code or dispatch directly to their personal wallet. The invoice reference is bound securely into the memo—formatting payment parameters without touching private keys.

When verifying payments, CheetahPay enforces strict technical honesty. On-chain block inclusion is confirmed through live testnet telemetry, while shielded note plaintexts remain protected until decrypted by the merchant's private wallet.

From unified cross-rail transaction auditing to illustrative onboarding estimators, every interaction is built fail-closed, non-custodial, and verifiable.

One seamless payment experience, bridging disparate financial worlds.

CheetahPay Shield.
Pay fiat to Web3. Pay crypto to Web2.`;

async function main() {
  const baseDir = path.join(__dirname, '../docs/demo-assets/ad-film');
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

  const outTxt = path.join(baseDir, 'cheetahpay-brand-film-script.txt');
  const outMp3 = path.join(baseDir, 'cheetahpay-brand-film-voiceover.mp3');
  const outSrt = path.join(baseDir, 'cheetahpay-brand-film-captions.srt');

  fs.writeFileSync(outTxt, masterScript.trim() + '\n', 'utf8');
  console.log('Script saved to:', outTxt);

  console.log('Requesting ElevenLabs TTS with alignment timestamps...');
  await generateWithTimestamps(masterScript, outMp3, outSrt);

  const durationStr = execSync(`ffprobe -i "${outMp3}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
  console.log(`Master Voiceover Audio Duration: ${durationStr} seconds`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
