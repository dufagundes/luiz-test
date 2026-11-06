// Render a contact sheet of frames for visual QA.
// Usage: node tools/stealth/stills.mjs <outDir> <scale> <frame> [frame...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import {execSync} from 'child_process';

const [outDir, scale, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const exe = process.env.BROWSER_EXE || undefined;
const browser = await openBrowser('chrome', {browserExecutable: exe, chromiumOptions: {gl: 'swangle'}});
const composition = await selectComposition({serveUrl, id: 'Stealth-Bomber', puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}});
const files = [];
for (const f of frames) {
  const out = path.join(outDir, `f${String(f).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame: Number(f), output: out, scale: Number(scale), puppeteerInstance: browser, chromiumOptions: {gl: 'swangle'}, overwrite: true});
  files.push(out);
  console.log('rendered', f);
}
await browser.close({silent: true});
// contact sheet: 4 per row
try {
  execSync(`ffmpeg -y -loglevel error ${files.map((f) => `-i ${f}`).join(' ')} -filter_complex "${files.map((_, i) => `[${i}:v]scale=270:-1,drawtext=text='${frames[i]}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black[v${i}]`).join(';')};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % 4) === 0 ? '0' : Array.from({length: i % 4}, () => 'w0').join('+')}_${Math.floor(i / 4) === 0 ? '0' : Array.from({length: Math.floor(i / 4)}, () => 'h0').join('+')}`).join('|')}:fill=black" ${path.join(outDir, 'sheet.png')}`);
  console.log('sheet', path.join(outDir, 'sheet.png'));
} catch (e) {
  console.log('sheet failed', String(e).slice(0, 300));
}
