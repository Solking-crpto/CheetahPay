const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  const baseDir = path.join(__dirname, '../docs/demo-assets/ad-film');
  const voPath = path.join(baseDir, 'cheetahpay-brand-film-voiceover.mp3');
  const srtPath = path.join(baseDir, 'cheetahpay-brand-film-captions.srt');
  const outMp4 = path.join(baseDir, 'cheetahpay-brand-film-preview.mp4');

  if (!fs.existsSync(voPath)) {
    throw new Error('Voiceover track not found at: ' + voPath);
  }

  const voDur = parseFloat(execSync(`ffprobe -i "${voPath}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim());
  console.log(`Voiceover duration: ${voDur}s`);

  const filmDuration = 82.0;

  const audioBedPath = path.join(__dirname, '../node_modules/.cache_ambient_bed.wav');
  if (!fs.existsSync(path.dirname(audioBedPath))) {
    fs.mkdirSync(path.dirname(audioBedPath), { recursive: true });
  }

  console.log('Generating ambient sound bed...');
  const synthCmd = `ffmpeg -y -f lavfi -i "aevalsrc=0.03*sin(2*PI*55*t)+0.02*sin(2*PI*110*t)+0.015*sin(2*PI*165*t)+0.01*sin(2*PI*220*t):s=44100:d=${filmDuration}" -af "afade=t=in:ss=0:d=2.5,afade=t=out:st=${filmDuration - 3.5}:d=3.5" "${audioBedPath}"`;
  execSync(synthCmd);

  const mixedAudioPath = path.join(__dirname, '../node_modules/.cache_mixed_audio.wav');
  console.log('Mixing voiceover and ambient bed...');
  const mixCmd = `ffmpeg -y -i "${audioBedPath}" -i "${voPath}" -filter_complex "[1:a]adelay=1200|1200,volume=1.4[vo];[0:a]volume=0.35[bed];[bed][vo]amix=inputs=2:duration=first:dropout_transition=2[aout]" -map "[aout]" -c:a pcm_s16le "${mixedAudioPath}"`;
  execSync(mixCmd);

  console.log('Rendering refined 1080p 16:9 brand film animatic preview...');

  const vf = [
    `color=c=#0B0D10:s=1920x1080:d=${filmDuration}:r=30[bg]`,
    
    // Scene 1: Amber line & Title (0 - 7s)
    `[bg]drawtext=text='COMMERCE MOVES ACROSS WORLDS':fontcolor=#F3F4F6:fontsize=44:x=(w-text_w)/2:y=(h-text_h)/2-40:enable='between(t,0.5,6.8)':alpha='if(lt(t,1.5),(t-0.5),if(gt(t,6.0),1-(t-6.0),1))'[v0]`,
    `[v0]drawbox=x=660:y=560:w=600:h=2:color=#D6A23D:t=fill:enable='between(t,1.0,6.8)'[v1]`,
    `[v1]drawtext=text='Traditional Banking Rails  •  Decentralized Networks  •  Zcash Privacy':fontcolor=#D6A23D:fontsize=20:x=(w-text_w)/2:y=(h-text_h)/2+40:enable='between(t,1.2,6.8)':alpha='if(lt(t,2.0),(t-1.2)/0.8,if(gt(t,6.0),1-(t-6.0),1))'[v2]`,
    
    // Scene 2 (7 - 17s): The Merchant's Need
    `[v2]drawtext=text='THE MERCHANT CONUNDRUM':fontcolor=#737B87:fontsize=18:x=(w-text_w)/2:y=240:enable='between(t,7.2,16.8)'[v3]`,
    `[v3]drawtext=text='Fragmented Rails & Settlement Friction':fontcolor=#F3F4F6:fontsize=38:x=(w-text_w)/2:y=290:enable='between(t,7.2,16.8)'[v4]`,
    `[v4]drawtext=text='• Disparate Custody Models   • Public Ledger Exposure   • Incompatible Settlement Rails':fontcolor=#D6A23D:fontsize=22:x=(w-text_w)/2:y=(h-text_h)/2+20:enable='between(t,8.5,16.8)'[v5]`,

    // Scene 3 (17 - 32s): Meet CheetahPay Shield
    `[v5]drawtext=text='MEET CHEETAHPAY SHIELD':fontcolor=#D6A23D:fontsize=20:x=(w-text_w)/2:y=220:enable='between(t,17.2,31.8)'[v6]`,
    `[v6]drawtext=text='Merchant Invoicing & Dynamic Address Classification':fontcolor=#F3F4F6:fontsize=36:x=(w-text_w)/2:y=270:enable='between(t,17.2,31.8)'[v7]`,
    `[v7]drawtext=text='[ Live Screen 02_invoice.mp4 Insertion Zone ]':fontcolor=#9CA3AF:fontsize=24:x=(w-text_w)/2:y=480:enable='between(t,17.2,31.8)'[v8]`,
    `[v8]drawtext=text='Evaluates Receiver Pools: Transparent (Public Ledger Warning) vs Unified (Shielded Capable)':fontcolor=#737B87:fontsize=18:x=(w-text_w)/2:y=540:enable='between(t,17.2,31.8)'[v9]`,

    // Scene 4 (32 - 48s): ZIP-321 Checkout
    `[v9]drawtext=text='ZIP-321 PROTOCOL DISPATCH':fontcolor=#D6A23D:fontsize=20:x=(w-text_w)/2:y=220:enable='between(t,32.2,47.8)'[v10]`,
    `[v10]drawtext=text='Client-Side Vector QR & Encrypted Memo Binding':fontcolor=#F3F4F6:fontsize=36:x=(w-text_w)/2:y=270:enable='between(t,32.2,47.8)'[v11]`,
    `[v11]drawtext=text='[ Live Screen 03_checkout.mp4 Insertion Zone ]':fontcolor=#9CA3AF:fontsize=24:x=(w-text_w)/2:y=480:enable='between(t,32.2,47.8)'[v12]`,
    `[v12]drawtext=text='Formats Payment Parameters For External Wallets · Zero Key Custody · 512-Byte Protected Memo':fontcolor=#737B87:fontsize=18:x=(w-text_w)/2:y=540:enable='between(t,32.2,47.8)'[v13]`,

    // Scene 5 (48 - 62s): Technical Honesty
    `[v13]drawtext=text='SETTLEMENT VERIFICATION INVARIANTS':fontcolor=#D6A23D:fontsize=20:x=(w-text_w)/2:y=220:enable='between(t,48.2,61.8)'[v14]`,
    `[v14]drawtext=text='Live Testnet Block Queries vs Private Note Decryption':fontcolor=#F3F4F6:fontsize=36:x=(w-text_w)/2:y=270:enable='between(t,48.2,61.8)'[v15]`,
    `[v15]drawtext=text='[ Live Screen 04_testnet_verification.mp4 Insertion Zone ]':fontcolor=#9CA3AF:fontsize=24:x=(w-text_w)/2:y=480:enable='between(t,48.2,61.8)'[v16]`,
    `[v16]drawtext=text='Block Inclusion Confirmed on Zcash Testnet (SoChain Node) · Status: Awaiting Wallet Note Decryption':fontcolor=#737B87:fontsize=18:x=(w-text_w)/2:y=540:enable='between(t,48.2,61.8)'[v17]`,

    // Scene 6 (62 - 71s): Coherent Workflow
    `[v17]drawtext=text='CROSS-RAIL TELEMETRY':fontcolor=#D6A23D:fontsize=20:x=(w-text_w)/2:y=220:enable='between(t,62.2,70.8)'[v18]`,
    `[v18]drawtext=text='Cross-Rail Transaction Records & Demo Estimator':fontcolor=#F3F4F6:fontsize=36:x=(w-text_w)/2:y=270:enable='between(t,62.2,70.8)'[v19]`,
    `[v19]drawtext=text='[ Live Screen 05_transactions.mp4 & 06_fund_wallet.mp4 Insertion Zone ]':fontcolor=#9CA3AF:fontsize=24:x=(w-text_w)/2:y=480:enable='between(t,62.2,70.8)'[v20]`,
    `[v20]drawtext=text='RFC-4180 CSV Export · Demo Estimator (No Live Funding · No Real Payment)':fontcolor=#737B87:fontsize=18:x=(w-text_w)/2:y=540:enable='between(t,62.2,70.8)'[v21]`,

    // Scene 7 & 8 (71 - 82s): Brand Statement & Closing Lockup
    `[v21]drawtext=text='CHEETAHPAY SHIELD':fontcolor=#F3F4F6:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2-70:enable='between(t,71.2,81.8)':alpha='if(lt(t,72.2),(t-71.2),1)'[v22]`,
    `[v22]drawtext=text='Pay fiat to Web3. Pay crypto to Web2.':fontcolor=#D6A23D:fontsize=26:x=(w-text_w)/2:y=(h-text_h)/2+10:enable='between(t,72.0,81.8)':alpha='if(lt(t,73.0),(t-72.0),1)'[v23]`,
    `[v23]drawbox=x=760:y=580:w=400:h=2:color=#D6A23D:t=fill:enable='between(t,72.5,81.8)'[v24]`,
    `[v24]drawtext=text='ZECATHON 2026 PROTOTYPE':fontcolor=#737B87:fontsize=18:x=(w-text_w)/2:y=(h-text_h)/2+90:enable='between(t,73.5,81.8)'[v25]`,
    `[v25]drawtext=text='cheetah-pay-ht9p.vercel.app':fontcolor=#9CA3AF:fontsize=16:x=(w-text_w)/2:y=(h-text_h)/2+130:enable='between(t,74.5,81.8)'[vout]`
  ].join(';');

  const renderCmd = `ffmpeg -y -i "${mixedAudioPath}" -filter_complex "${vf}" -map "[vout]" -map 0:a -c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${filmDuration} "${outMp4}"`;
  
  execSync(renderCmd);

  const stats = fs.statSync(outMp4);
  console.log(`Refined Master Brand Film Animatic Preview rendered successfully!`);
  console.log(`Path: ${outMp4}`);
  console.log(`File size: ${stats.size} bytes`);
  console.log(`Duration: ${filmDuration} seconds @ 1920x1080 30fps`);

  if (fs.existsSync(audioBedPath)) fs.unlinkSync(audioBedPath);
  if (fs.existsSync(mixedAudioPath)) fs.unlinkSync(mixedAudioPath);
}

main().catch(err => {
  console.error('Animatic render failed:', err.message);
  process.exit(1);
});
