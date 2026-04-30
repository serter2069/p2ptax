/**
 * Logo optimization script for P2PTax brand update (issue #1636).
 * Source: /tmp/p2ptax-logo-source.png (1024x1024 square)
 * Output: assets/images/
 *
 * Run: node scripts/optimize-logo.mjs
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const sharp = require('/opt/homebrew/lib/node_modules/@gitlawb/openclaude/node_modules/sharp');

const SRC = '/tmp/p2ptax-logo-source.png';
const OUT = path.join(fileURLToPath(import.meta.url), '../../assets/images');

async function run() {
  console.log('Source:', SRC);
  console.log('Output dir:', OUT);

  // logo.webp 200x200
  await sharp(SRC).resize(200, 200).webp({ quality: 85 }).toFile(`${OUT}/logo.webp`);
  console.log('logo.webp done');

  // logo@2x.webp 400x400
  await sharp(SRC).resize(400, 400).webp({ quality: 85 }).toFile(`${OUT}/logo@2x.webp`);
  console.log('logo@2x.webp done');

  // logo.png 200x200
  await sharp(SRC).resize(200, 200).png({ compressionLevel: 9, palette: true }).toFile(`${OUT}/logo.png`);
  console.log('logo.png done');

  // logo@2x.png 400x400
  await sharp(SRC).resize(400, 400).png({ compressionLevel: 9, palette: true }).toFile(`${OUT}/logo@2x.png`);
  console.log('logo@2x.png done');

  // logo-splash.png 512x512 (centered on white 512x512 canvas)
  const splashBg = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  }).png().toBuffer();
  const logoFor512 = await sharp(SRC).resize(400, 400).png().toBuffer();
  await sharp(splashBg)
    .composite([{ input: logoFor512, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/logo-splash.png`);
  console.log('logo-splash.png done');

  // logo-icon-1024.png 1024x1024 (optimized copy of source)
  await sharp(SRC).resize(1024, 1024).png({ compressionLevel: 9 }).toFile(`${OUT}/logo-icon-1024.png`);
  console.log('logo-icon-1024.png done');

  // favicon.png 64x64
  await sharp(SRC).resize(64, 64).png({ compressionLevel: 9 }).toFile(`${OUT}/favicon.png`);
  console.log('favicon.png done');

  // favicon-32.png 32x32
  await sharp(SRC).resize(32, 32).png({ compressionLevel: 9 }).toFile(`${OUT}/favicon-32.png`);
  console.log('favicon-32.png done');

  // og-image.png 1200x630 (white bg, logo 400x400 centered)
  const ogBg = await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  }).png().toBuffer();
  const logoFor400 = await sharp(SRC).resize(400, 400).png().toBuffer();
  await sharp(ogBg)
    .composite([{ input: logoFor400, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/og-image.png`);
  console.log('og-image.png done');

  // logo-white.png 200x200 — negate (invert colors)
  // For a logo on dark background. If the logo has a white background this
  // won't look great, but we generate it anyway and can replace manually.
  await sharp(SRC)
    .resize(200, 200)
    .negate({ alpha: false })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/logo-white.png`);
  console.log('logo-white.png done');

  // Print file sizes
  const { statSync } = await import('fs');
  const files = [
    'logo.webp', 'logo@2x.webp', 'logo.png', 'logo@2x.png',
    'logo-splash.png', 'logo-icon-1024.png', 'favicon.png', 'favicon-32.png',
    'og-image.png', 'logo-white.png'
  ];
  console.log('\nFile sizes:');
  for (const f of files) {
    const size = statSync(`${OUT}/${f}`).size;
    console.log(`  ${f}: ${(size / 1024).toFixed(1)}KB`);
  }
  console.log('\nAll done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
