# Asset credits & licences — "WHAT IF A COW WENT GROCERY SHOPPING?"

## Third-party assets used

| Asset | Source | Licence | Attribution required? | How it's used |
|---|---|---|---|---|
| Narrator voice "en-us-ryan-high" (Piper TTS voice model) | github.com/rhasspy/piper releases v0.0.2 | Piper is MIT. The voice card lists its training dataset; check its terms before monetising (see note below) | Not required by MIT; credited here as good practice | Speaks the narration (generated offline by `tools/build_audio.py`) |
| Piper TTS engine (`piper-tts` on PyPI) | github.com/rhasspy/piper | MIT | No | Text-to-speech engine |
| "Baloo 2" font (`@fontsource/baloo-2`) | Google Fonts, by Ek Type | SIL Open Font License 1.1 | No (the OFL allows use in videos) | Captions, titles, store signs, milk label |
| Noto Color Emoji (🐄 on the end card, rendered by the system) | Google | SIL Open Font License 1.1 | No | One emoji on the end card |
| Three.js, React Three Fiber, React | npm | MIT | No | 3D engine |
| Remotion | npm | Remotion License (free for individuals and companies with up to 3 employees; larger companies need a paid licence) | No | Video renderer |

**Note on the voice:** the Ryan voice was trained on a public speech dataset. If you plan to
monetise the channel, read the `MODEL_CARD` file inside the downloaded voice archive. To be fully
safe, you can swap in any voice you have rights to by changing `"voice"` in `tools/script.json`.

## Made from scratch for this project (no licence issues; you own them)

* **Every 3D model:** the cow, the cashier, the shopping cart, the milk carton, apples, lettuce,
  carrots, cans, the protest sign, shelves, products, the dairy fridge, the customer-service desk,
  the doors, the trees and the whole store. They are built in code from spheres, cylinders,
  boxes and extrusions (`src/three/`).
* **Every texture:** the cow spots, floor tiles, the milk label with its cow drawing, signs and
  product labels. They are drawn at runtime on an HTML canvas (`src/three/materials.ts`).
* **All music and every sound effect:** the shopping tune, suspense strings, angry march, victory
  stabs, door chime, hoof clops, can crash, lettuce crunch, the bass hit, the cash register, the
  gulp, the slam, the synthesised MOO, the party horn, the rimshot and the cowbell. They are
  synthesised with numpy/scipy in `tools/build_audio.py`. No samples are used.

## Considered but not used

Poly Haven, Kenney, Quaternius, OpenGameArt and Sketchfab could not be reached from the build
environment (network-blocked), so nothing was downloaded from them. Everything above was
procedurally generated instead, so there are no third-party model or texture licences to track.
