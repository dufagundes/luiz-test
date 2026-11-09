import os from 'os';
import {Config} from '@remotion/cli/config';

// Tuned for a Ryzen 5 1500X (4 cores / 8 threads) + 16 GB RAM + GTX 1660 Ti.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
// WebGL is heavier than plain HTML, so use at most 4 parallel browser tabs.
Config.setConcurrency(Math.max(1, Math.min(4, os.cpus().length)));
Config.setChromiumOpenGlRenderer('angle');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
// Optional: use an already-installed Chrome/Chromium instead of Remotion's auto-download.
// Leave REMOTION_BROWSER unset on Windows - Remotion downloads its own browser the first time.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
