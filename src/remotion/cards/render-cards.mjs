import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projects = [
  { id: 'P-001', color: '#1e3a5f', filters: ['agua'] },
  { id: 'P-002', color: '#1c4a3a', filters: ['agua'] },
  { id: 'P-003', color: '#3a2660', filters: ['digital'] },
  { id: 'P-004', color: '#2c2a10', filters: ['digital'] },
  { id: 'P-005', color: '#1c3628', filters: ['agua'] },
  { id: 'P-006', color: '#2a1f38', filters: ['agua'] },
];

const outDir = path.join(__dirname, '../../../public/assets/cards');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('Bundling card compositions...');
const bundled = await bundle({
  entryPoint: path.join(__dirname, 'RootCards.jsx'),
  webpackOverride: (config) => config,
});

for (const p of projects) {
  const compId = p.filters.includes('agua') ? 'AguaCardVideo' : 'DigitalCardVideo';
  const slug = p.id.toLowerCase().replaceAll('-', ''); // 'P-001' → 'p001'
  const outputLocation = path.join(outDir, `${slug}.mp4`);

  console.log(`Rendering ${p.id} → ${slug}.mp4 (${compId})...`);
  const composition = await selectComposition({
    serveUrl: bundled,
    id: compId,
    inputProps: { color: p.color, id: p.id },
  });

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation,
    inputProps: { color: p.color, id: p.id },
  });

  console.log(`  ✓ ${slug}.mp4`);
}

console.log('✓ All 6 card videos rendered to public/assets/cards/');
