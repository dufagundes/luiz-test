// Render inspection stills: node tools/stills.mjs <outDir> <comp> <sec> [sec...]
import path from 'path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [outDir, comp, ...secs] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const composition = await selectComposition({serveUrl, id: comp, chromiumOptions: {gl: (process.env.REMOTION_GL ?? 'angle')}, browserExecutable});
for (const s of secs) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(s) * 30));
  const t0 = Date.now();
  await renderStill({composition, serveUrl, frame, output: path.join(outDir, `${comp}-${s}.png`), scale: 0.5, chromiumOptions: {gl: (process.env.REMOTION_GL ?? 'angle')}, browserExecutable});
  console.log(`frame ${frame} (${s}s) in ${Date.now() - t0} ms`);
}
