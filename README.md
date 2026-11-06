# Message From Tomorrow — 30s vertical animated short

**Final video:** `out/message-from-tomorrow.mp4` (1080×1920, 30 fps, 30 s, H.264 + AAC audio)

Made entirely in code with Remotion + React + SVG. Every character, room and effect is drawn here, with no image files.
Narration: Piper TTS (free, offline). Sound effects: synthesized with Python/numpy. No paid services.

## Story (7 scenes)
| Time | Scene |
|---|---|
| 0–3.5s | **Hook:** at 3:17 a.m. a phone lights up: "Me (2034): DON'T OPEN THE DOOR." |
| 3.5–7.6s | Maya reads it in bed. A second message: "It's not Mom." |
| 7.6–13.1s | Three slow knocks. Feet shadows under the door. "Maya, sweetie… open the door." |
| 13.1–17.1s | She runs to the window. Mom is outside in the driveway, waving. |
| 17.1–21s | The handle turns. New text: "Open the window. Let her in." |
| 21–26s | The door bursts open. It's the real Mom: "Who are you texting?" |
| 26–30s | **Twist:** outside the glass, holding a phone, is *Maya*. "Next time, let me in." |

## Use it on your Windows PC (optional)
1. Install **Node.js LTS** (free) from nodejs.org.
2. Download this project, open the folder, type `cmd` in the address bar and press Enter.
3. Run `npm install` once.
4. `npm run studio` opens a live preview in your browser.
5. `npm run preview` renders a fast half-size test video, and `npm run render` renders the full 1080×1920 MP4 into `out/`.

Rendering is tuned for a Ryzen 5 1500X / 16 GB: 6 render threads, JPEG frames. Expect a few minutes for the full render.

## Files
- `src/characters/Person.tsx`: one rigged character used for Maya, Mom and the double
- `src/components/`: bedroom set, phone UI, camera, subtitles, effects
- `src/scenes/S1…S7`: the seven scenes
- `tools/lines.json` + `tools/make_audio.py`: narration script, then voices, sound effects and subtitle timing
- `public/soundtrack.wav`: the final mixed audio
