# Reusable template: 3D educational explainer Reels

Video 1 (stealth bomber) is the reference build. Every future explainer reuses the same pipeline:

```
script.json  ──(build_audio.py)──►  soundtrack.wav + timeline.json  ──(Remotion + Three.js)──►  MP4
 narration        Piper TTS, synthesized SFX,                         3D scenes keyed to the
 + subtitle       music bed, loudness -14 LUFS                        exact time each phrase
 chunks                                                               is spoken
```

## The parts and what to reuse

| File | What it is | Reuse for a new topic? |
|---|---|---|
| `tools/stealth/script.json` | Narration. `\|` splits subtitle chunks. One line per scene. | **Rewrite** |
| `tools/stealth/build_audio.py` | Voice, music, SFX, word timing | Copy. Edit only the "feature-specific beats" SFX block |
| `src/stealth/lib.ts` | Timing helpers (`beat(line, chunk)`), easing, camera, 3D→2D projection | Copy as-is |
| `src/stealth/ui/Overlay.tsx` | Checklist, radar HUD, subtitles, title cards, labels, transitions, grain | Copy. Change the `FEATURES` list and the HUD graphic |
| `src/stealth/three/World.tsx` | Ocean, sky, studio stage, lights, camera rig, reflections | Copy as-is |
| `src/stealth/three/Props.tsx` | Wavefronts, beams, rings, particle plumes, comparison jet, radar station | Copy what fits |
| `src/stealth/three/Bomber*.ts(x)` | The hero model | **Replace** with the new subject |
| `src/stealth/Scenes.tsx` | One component per scene | **Rewrite** (keep the patterns) |

## Making Video 2 (step by step)
1. Copy the folders: `src/stealth` → `src/<topic>`, and `tools/stealth` → `tools/<topic>`. Change the output paths at the bottom of `build_audio.py`.
2. Write `script.json` to this structure, which suits 45–60 s:
   hook (≤3 s to the payoff) → why it matters → 5 features (about 6 s each) → how they work together → surprising fact + comment question.
3. Run `python tools/<topic>/build_audio.py`. It prints each line's start/end and warns if the total is outside 45–60 s. Adjust `gap` or `lengthScale` and run it again.
4. Build the hero model from code (lathe, extrude, or lofted sections like `bomberGeometry.ts`). Don't use paid or downloaded models.
5. Write each scene as `cam = f(t)` plus objects driven by `t`. Use `beat('f2', 3)` to trigger an effect exactly when chunk 3 of line f2 is spoken.
6. Register the composition in `src/Root.tsx`, then check frames: `node tools/stealth/stills.mjs out/qa 0.5 30 200 400 …` (renders a contact sheet).
7. Run `npm run <topic>:preview`, then `npm run <topic>:render`.

## Style rules that keep it looking like a Reel, not a slideshow
- The camera never stands still. Use a slow orbit, dolly, or chase on every shot, and ease all moves.
- Each feature gets a physical demonstration (waves, rays, particles, moving parts), not just a label.
- Labels are pinned to 3D points with `project()`, so they track the object.
- Subtitles: one chunk of 2–5 words at a time, and the active word turns yellow.
- Put a hard cut with a flash and whoosh on every scene change.
- Keep the area from 1600 px to the bottom free; the platform's caption UI covers it.
- State claims carefully ("can look about as small as", "not invisible"), and note sources in `POST.md`.

## Free tools used
Remotion (free for individuals and small teams; see remotion.dev/license), Three.js, React Three Fiber, Piper TTS (MIT), numpy, ffmpeg. No paid APIs.
