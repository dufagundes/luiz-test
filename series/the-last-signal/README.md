# THE LAST SIGNAL: Chapter Production System

An interactive animated series built with Remotion + React + SVG. Everything is drawn in code and produced with free, offline tools.

```
series/the-last-signal/
  STORY_BIBLE.md          characters, locations, timeline, secrets, clues (source of truth)
  SEASON_1_OUTLINE.md     12-chapter plan with fixed points + vote branches
  DECISIONS.md            log of real audience votes and their consequences
  chapters/chXX/
    chapter.json          script: lines (voice, text, subtitle text, pauses) + sound-effect cues
    POST.md               title, caption, poll, pinned comment, teaser
src/series/
  cast.ts                 official character designs (never redefine looks in a chapter)
  rig/Character.tsx       the one character rig everyone uses
  locations/              Town (Harlow Point + tower), Attic (Nora's room), …
  props/                  HamRadio, SignalPhone, MiloDrawing, …
  ui/                     subtitles, countdown HUD, chapter title, A/B ChoiceCard, glows
  chapters/chXX/          ChXX.tsx (the animation) + timeline.json (generated)
tools/series/build_chapter_audio.py   voices + sound design, then soundtrack.wav + timeline.json
public/series/chXX/soundtrack.wav     final mixed audio per chapter
out/the-last-signal/                  rendered MP4s
```

## Making the next chapter (what Claude does after each vote)
1. **Log the vote** in `DECISIONS.md` (real numbers only).
2. **Write the script** in `chapters/chXX/chapter.json`. Follow the outline's fixed points plus the winning branch. Open with a 2-second hook. End with the **standard interactive ending** lines (`noSubs: true`):
   - `e2`: "What should we do next? Comment one or two below, and tell me why!"
   - `e3`: "Follow so you don't miss what happens next!"
   Add the ending SFX cues: impact, tick, riser, 3 pops, slow heartbeat (copy from `chapters/ch02/chapter.json`).
3. **Build audio:** `python tools/series/build_chapter_audio.py chXX <voices_dir>` places every line, generates the sound effects, and writes frame-accurate word timing. Voice takes are cached, so editing one line won't shift the timing of the others (set `TLS_FRESH_VOICES=1` to regenerate all).
4. **Animate** `src/series/chapters/chXX/ChXX.tsx`. Copy the Ch01 structure: a scene table (frame ranges), shots built from `Attic`/`Town`/new locations, `Character` with cast members, then `ChapterTitle`, `Countdown`, `SeriesSubtitles`, **`InteractiveEnding`** (question, choices 1/2 with short descriptions, next chapter number; copy the Ch02 usage) and `<Audio>`.
5. **Register** the composition in `src/Root.tsx` as `TLS-ChXX`.
6. **Preview** at half size, check frames, fix, **render** the final MP4.
7. **Update** the Story Bible clue tracker and write `POST.md`.

## Free voices used (Piper TTS, MIT)
Download from https://github.com/rhasspy/piper/releases/tag/v0.0.2 into a `voices/` folder (git-ignored):
`voice-en-us-ryan-high`, `voice-en-us-lessac-medium`, `voice-en-us-libritts-high`. Then `pip install piper-tts numpy`.

## Rendering on your PC (Windows 10, Ryzen 5 1500X, 16 GB) when you're ready
1. Install Node.js LTS (free) and download this repository.
2. In the project folder: `npm install`
3. Preview in the browser: `npm run studio` (pick **TLS-Ch01**)
4. Fast half-size test: `npm run tls:preview:ch01`
5. Full quality: `npm run tls:render:ch01` (6 render threads, about 3–6 minutes)
