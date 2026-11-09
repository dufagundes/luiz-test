# WHAT IF? — 3D animated comedy shorts

**Episode 1: "What if a cow went grocery shopping?"**

| File | What it is |
|---|---|
| `out/what-if-cow-grocery-shopping.mp4` | The finished episode: 1080×1920 vertical, 30 fps, 44 s, H.264 video + AAC audio |
| `out/cow-tech-test.mp4` | Phase 1 technical test: 10.4 s, 3D only, no audio |

This is a stand-alone project. It shares no characters, story, assets or code with *The Last
Signal* or the other videos in this repository.

Everything is real 3D (Three.js, rendered by React Three Fiber inside Remotion), and every model
is built in code:
- a toy-like spotted cow with a bell collar, an expressive face and IK arms and legs;
- a cashier with glasses;
- a tiny shopping cart and a milk carton with an original label;
- a whole supermarket: sliding doors, produce stand, aisles of products, dairy fridge,
  customer-service desk and signs.

Music and sound effects are synthesised in Python, and the narrator is Piper TTS (free, offline).
See `ASSET_CREDITS.md`.

## The story (44 s)
| Time | Shot |
|---|---|
| 0–3.4 s | **Hook.** "What if a cow went grocery shopping?" She strolls through the automatic doors pushing a tiny cart. |
| 3.4–8.2 s | She sniffs an apple, tosses it into the cart, inspects a lettuce suspiciously… and eats it. |
| 8.2–10.8 s | Her tail whips a can pyramid (CRASH!). Awkward look back. Tiptoes away. |
| 10.8–16.4 s | "But then… she discovers the milk aisle." She grabs a carton and reads the label. It has a cow on it. |
| 16.4–19.4 s | Silence. **Bass hit.** Snap zoom into her shocked face. |
| 19.4–25.4 s | Price insert ($6.00?!), a stare into the camera, "…not even getting royalties?", a slow, furious head turn, and the cashier gulps. |
| 25.4–30.6 s | Angry march: stomping, dragging the cart, steam from her nostrils. |
| 30.6–35.8 s | SLAM on the counter. The cashier stares in disbelief. She raises a **PAY THE COW!** sign. |
| 35.8–39.4 s | Victorious MOO, confetti, and the cashier claps awkwardly. |
| 39.4–44 s | End card: "WHAT IF…?" / "FOLLOW FOR MORE RIDICULOUS SCENARIOS 🐄", rimshot and cowbell. |

---

## Run it on Windows 10 (GTX 1660 Ti / Ryzen 5 1500X / 16 GB)

### 1. Install (one time, all free)
1. **Node.js LTS** (v20 or v22) from https://nodejs.org. Use the default options.
2. **Git for Windows** from https://git-scm.com. Optional: only needed to clone the repo.
   Otherwise use GitHub's "Download ZIP".
3. **Python 3.11+** from https://python.org, only needed to rebuild narration or audio.
   Tick **"Add python.exe to PATH"** during setup.
4. An up-to-date **NVIDIA driver**, so the GTX 1660 Ti renders the 3D.

### 2. Set up the project
Open the `what-if` folder in File Explorer, type `cmd` in the address bar and press Enter. Then run:
```
npm install
```
The first render downloads Remotion's own headless Chrome automatically (~100 MB).

### 3. Preview live in your browser
```
npm run studio
```
Pick **CowShopping** on the left and press play. Scrub the timeline to see any moment. Editing a
number in `src/story/cowStory.ts` updates the preview instantly.

### 4. Render the video
| Command | Output | Rough time on your PC |
|---|---|---|
| `npm run test:render` | `out/cow-tech-test.mp4` (10 s test) | 1–3 min |
| `npm run preview` | `out/preview-540x960.mp4` (half-size full episode) | 2–5 min |
| `npm run render` | `out/what-if-cow-grocery-shopping.mp4` (final 1080×1920) | 5–15 min |

The render scripts use `--gl=angle`, which uses your GPU through DirectX. If you see a black
video or a WebGL error, try `npx remotion render CowShopping out/video.mp4 --gl=swangle`.
That renders on the CPU instead: slower, but it always works.

`remotion.config.ts` limits rendering to 4 parallel tabs and uses JPEG frames, which keeps a
4-core Ryzen with 16 GB RAM responsive. If it uses too much memory, change `4` to `2` there.

### 5. (Optional) Change the narration or sound
1. Install the Python packages: `pip install piper-tts numpy scipy`
2. Download the voice, once, into a `voices` folder:
   ```
   mkdir voices
   cd voices
   curl -L -o ryan.tgz https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-high.tar.gz
   tar -xzf ryan.tgz
   cd ..
   ```
   `curl` and `tar` are built into Windows 10.
3. Edit the lines or their start times in `tools/script.json`, then run `npm run audio`. This
   rewrites `public/cow-shopping/soundtrack.wav` and the caption timing in `src/timeline.json`.
4. Render again.

---

## How it works (for the curious)
- `src/three/Cow.tsx`: the cow rig. Each frame sets numbers (walk distance, lean, head angles,
  eye size, pupils, brows, mouth, ears, tail, hoof targets, steam), and the body follows.
  - Arms and legs use two-bone IK (`src/lib/ik.ts`), so hooves really grip the cart handle,
    the apple and the carton.
  - The stride is driven by the distance walked, so the feet don't slide.
- `src/three/Cashier.tsx`, `Cart.tsx`, `Props.tsx`, `Store.tsx`: the other characters, props
  and set, built from spheres, cylinders and boxes. Repeated products use instancing to stay
  light on the GPU.
- `src/story/cowStory.ts`: the whole episode as 15 shots. Each shot is a function of time that
  returns the camera, the poses and the props. Change numbers there to restage a shot.
- `src/CowShopping.tsx`: puts the 3D scene, captions, comic words (CRASH! SLAM! MOOOOO!), the
  dramatic grade and the end card together, then adds the soundtrack.
- `tools/build_audio.py`: generates the narration with Piper, synthesises every sound effect
  and music cue, mixes them with ducking, and writes the caption word timings.
- `tools/stills.mjs` + `tools/sheet.py`: render inspection stills and contact sheets.

## Making the next episode
Copy `src/story/cowStory.ts` to a new story file and `tools/script.json` to a new script. Add
a composition in `src/Root.tsx`, then reuse the store, characters and overlays.

## Requirements summary
- Node.js 20+ and npm (installs Remotion 4, React 19, Three.js r169 and React Three Fiber 9)
- Python 3.10+ with `piper-tts`, `numpy`, `scipy`: only for rebuilding audio
- The Piper voice `en-us-ryan-high` (~120 MB): only for rebuilding audio
- No paid software, no Blender, no external 3D models
