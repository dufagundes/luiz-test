import os from 'os';
import {Config} from '@remotion/cli/config';

// Tuned for a 4-core / 8-thread CPU (Ryzen 5 1500X) with 16 GB RAM.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
// 6 of 8 threads keeps the PC responsive while rendering; never more than the machine has.
Config.setConcurrency(Math.max(1, Math.min(6, os.cpus().length)));
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
