import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Bundling composition...');
const bundled = await bundle({
  entryPoint: path.join(__dirname, 'Root.jsx'),
  webpackOverride: (config) => config,
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: 'PTAPIntro',
});

console.log(`Rendering ${composition.durationInFrames} frames at ${composition.fps}fps...`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: 'h264',
  outputLocation: path.join(__dirname, '../../public/assets/ptap-intro.mp4'),
});

console.log('✓ Render complete: public/assets/ptap-intro.mp4');
