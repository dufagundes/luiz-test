# Stealth bomber explainer: how to watch, edit and re-render

Everything for this video was built in code: the 3D models, the ocean, the lighting, the animation, the narration voice, the music and the sound effects. It uses free tools only.

## Just want the video?
Open **`out/stealth/stealth-bomber-radar.mp4`**. It is ready to post (1080×1920, 30 fps, with narration, music and sound effects).
The title, caption, hashtags and script are in [`POST.md`](POST.md).

## Render it yourself on your Windows PC (optional)
Your GTX 1660 Ti makes this much faster than the cloud render.

1. Install **Node.js LTS** (free) from nodejs.org. Use the default options.
2. Download this repository (green **Code** button → **Download ZIP**) and unzip it.
3. Open the folder, click the address bar, type `cmd` and press Enter.
4. Run once: `npm install`
5. Live preview in your browser (scrub the timeline, see every frame): `npm run stealth:studio`, then choose **Stealth-Bomber** on the left.
6. Quick half-size test video: `npm run stealth:preview` → `out/stealth/preview-540x960.mp4`
7. Full-quality video: `npm run stealth:render` → `out/stealth/stealth-bomber-radar.mp4`

These scripts use `--gl=angle`, which runs the 3D on your graphics card. Rendering uses up to 6 threads of your Ryzen 5 1500X, so the PC stays usable. Expect roughly 5–15 minutes for the full render.

If the render shows black 3D frames, update your NVIDIA driver, or replace `--gl=angle` with `--gl=swangle` (slower, but it works everywhere).

## Change the narration (optional)
Audio is pre-built in `public/stealth/soundtrack.wav`, so you only need this if you edit the script.
1. Install Python 3 and run: `pip install piper-tts numpy`
2. Put the free Piper voice `en-us-ryan-high.onnx` (+ `.onnx.json`) in a `voices/` folder. It comes from the rhasspy/piper GitHub releases (v0.0.2, `voice-en-us-ryan-high.tar.gz`).
3. Edit `tools/stealth/script.json`, then run `npm run stealth:audio`. The subtitles and every animation cue re-time themselves automatically.

## Where things are
- `src/stealth/three/bomberGeometry.ts` builds the procedural flying-wing model (lofted airfoil sections and a double-W sawtooth trailing edge).
- `src/stealth/three/Bomber.tsx` holds the materials, bay doors, x-ray engines and thermal mode.
- `src/stealth/three/World.tsx` has the Gerstner-wave ocean shader, dusk sky, studio stage, lights and reflections.
- `src/stealth/three/Props.tsx` has the comparison jet, radar station, radar wavefronts, beams, rings and particle plumes.
- `src/stealth/Scenes.tsx` holds the 9 scenes.
- `src/stealth/ui/Overlay.tsx` has the checklist, radar HUD, subtitles, labels and transitions.
- `tools/stealth/build_audio.py` handles voice, music, SFX and timing. `tools/stealth/stills.mjs` renders a contact sheet of frames for QA.
- [`../TEMPLATE.md`](../TEMPLATE.md) explains how to reuse all of this for the next video.
