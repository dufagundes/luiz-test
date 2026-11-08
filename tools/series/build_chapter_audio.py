"""
THE LAST SIGNAL: chapter audio builder (free and offline).

Reads   series/the-last-signal/chapters/<id>/chapter.json
Writes  public/series/<id>/soundtrack.wav             (narration + voices + sound design, mixed)
        src/series/chapters/<id>/timeline.json        (frame-accurate line + word timing for subtitles/lip-sync)

Voices: Piper TTS (MIT license) with free voices from github.com/rhasspy/piper (release v0.0.2):
  narrator -> en-us-ryan-high
  nora     -> en-us-lessac-medium        (radio = the same voice through a radio filter; this is a story clue)
  theo     -> en-us-libritts-high, speaker 28
  milo     -> en-us-libritts-high, speaker 12, pitched up
Sound effects: synthesized from scratch with numpy (no samples, no licenses).

Usage:  python tools/series/build_chapter_audio.py ch01 [voices_dir]
"""
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CH = sys.argv[1] if len(sys.argv) > 1 else "ch01"
VOICES = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "voices")
SR = 44100
FPS = 30

VOICE_CAST = {
    # name: (model, speaker, length_scale, pitch_factor)
    "narrator": ("en-us-ryan-high.onnx", 0, 0.93, 1.0),
    "nora": ("en-us-lessac-medium.onnx", 0, 0.95, 1.0),
    "radio": ("en-us-lessac-medium.onnx", 0, 1.05, 0.97),
    "theo": ("en-us-libritts-high.onnx", 28, 0.92, 1.0),
    "milo": ("en-us-libritts-high.onnx", 12, 0.95, 1.12),
    # Theo's voice as a text message / Echo: same speaker, a touch lower, thin "phone" texture
    "echo": ("en-us-libritts-high.onnx", 28, 0.98, 0.95),
}

cfg = json.load(open(os.path.join(ROOT, "series", "the-last-signal", "chapters", CH, "chapter.json")))
rng = np.random.default_rng(11)


# ---------------- helpers ----------------
def read_wav(path):
    with wave.open(path) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return x, sr


def resample(x, sr_in, sr_out):
    n = int(len(x) * sr_out / sr_in)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def trim(x, th=0.015):
    idx = np.where(np.abs(x) > th)[0]
    if len(idx) == 0:
        return x
    return x[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.05 * SR)]


def band(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / (1 + (f / hi) ** 4))
    return np.fft.irfft(X, len(x)).astype(np.float32)


def lowpass(x, hi):
    return band(x, 1, hi)


def reverb(x, taps=((0.045, 0.45), (0.083, 0.35), (0.127, 0.28), (0.191, 0.2), (0.263, 0.14))):
    out = np.concatenate([x, np.zeros(int(0.4 * SR), np.float32)])
    for t, g in taps:
        d = int(t * SR)
        out[d:d + len(x)] += x * g
    return out


def env(n, a, d):
    t = np.arange(n) / SR
    return (np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)).astype(np.float32)


def noise(n):
    return rng.standard_normal(n).astype(np.float32)


# ---------------- voices ----------------
tmp = os.path.join(VOICES, "_render_" + CH)
os.makedirs(tmp, exist_ok=True)
rendered = []
cursor = 0.0
for line in cfg["lines"]:
    model, spk, ls, pitch = VOICE_CAST[line["voice"]]
    out = os.path.join(tmp, line["id"] + ".wav")
    cmd = [sys.executable, "-m", "piper", "-m", os.path.join(VOICES, model), "-f", out,
           "--length-scale", str(ls), "--sentence-silence", "0.12", "-s", str(spk)]
    # cache: reuse an existing take if text + voice settings are unchanged (keeps animation timing stable;
    # Piper adds slight random variation on every synthesis)
    key = json.dumps([line["text"], model, spk, ls])
    key_path = out + ".key"
    cached = os.path.exists(out) and os.path.exists(key_path) and open(key_path).read() == key
    if not cached or os.environ.get("TLS_FRESH_VOICES"):
        subprocess.run(cmd, input=line["text"].encode(), check=True, capture_output=True)
        open(key_path, "w").write(key)
    x, sr = read_wav(out)
    x = trim(resample(x, sr, SR / pitch))  # pitch_factor > 1 => higher + faster
    speech = len(x) / SR
    if line["voice"] == "radio":
        # old ham-radio transmission: narrow band, soft clipping, crackle, a little echo
        x = band(x, 350, 3000)
        x = np.tanh(x * 3.0) / np.tanh(3.0)
        crackle = (rng.random(len(x)) < 0.002).astype(np.float32) * noise(len(x)) * 0.6
        x = x + crackle + noise(len(x)) * 0.015
        x = reverb(x, ((0.06, 0.25), (0.13, 0.12)))
    elif line["voice"] == "echo":
        x = band(x, 250, 4200)
        x = reverb(x, ((0.05, 0.3), (0.11, 0.2), (0.19, 0.1)))
    elif line["voice"] in ("theo", "milo", "nora"):
        x = reverb(x, ((0.03, 0.15), (0.07, 0.07)))
    x = x / (np.abs(x).max() + 1e-6) * (0.72 if line["voice"] == "radio" else 0.8)
    start = line["start"] if "start" in line else cursor + line.get("gap", 0.3)
    cursor = start + speech
    rendered.append((line, x, start, speech))

duration = max(cfg.get("minDuration", 45), cursor + cfg.get("tail", 2.0))
duration = min(duration, cfg.get("maxDuration", 60))
if cursor > duration:
    raise SystemExit(f"Narration ({cursor:.1f}s) is longer than the max duration")
duration = round(duration * FPS) / FPS
N = int(duration * SR)
mix = np.zeros(N + SR * 3, np.float32)
starts = {l["id"]: s for l, _, s, _ in rendered}
ends = {l["id"]: s + d for l, _, s, d in rendered}


def T(v):
    """time spec: number | 'end' | 'lineId+0.5' | 'lineId.end-0.2'"""
    if isinstance(v, (int, float)):
        return float(v)
    if v == "end":
        return duration
    m = re.match(r"^([a-z0-9]+)(\.end)?([+-][0-9.]+)?$", v)
    if not m:
        raise ValueError(v)
    base = ends[m.group(1)] if m.group(2) else starts[m.group(1)]
    return base + float(m.group(3) or 0)


def add(sig, at, gain=1.0):
    i = max(0, int(at * SR))
    j = min(len(mix), i + len(sig))
    if j > i:
        mix[i:j] += sig[: j - i] * gain


# ---------------- sound design library ----------------
def sfx_drone(c):
    a, b = T(c.get("from", 0)), T(c.get("to", "end"))
    n = int((b - a) * SR)
    t = np.arange(n) / SR
    d = 0.5 * np.sin(2 * np.pi * 55 * t) + 0.4 * np.sin(2 * np.pi * 55.6 * t) + 0.2 * np.sin(2 * np.pi * 82.4 * t)
    d += lowpass(noise(n), 200) * 1.2
    r0, r1 = c.get("rise", [0, b])
    sw = 0.5 + 0.5 * np.clip((t + a - r0) / max(1, r1 - r0), 0, 1)
    add((d * sw).astype(np.float32), a, 0.07 * c.get("gain", 1))


def sfx_rain(c):
    a, b = T(c.get("from", 0)), T(c.get("to", "end"))
    n = int((b - a) * SR)
    r = band(noise(n), 400, 5000) * 0.25 + band(noise(n), 2000, 9000) * 0.12
    drops = (rng.random(n) < 0.0008).astype(np.float32) * noise(n)
    r += band(drops, 1500, 6000) * 0.8
    f = np.minimum(1, np.arange(n) / SR / 1.0)
    add(r * f, a, 0.18 * c.get("gain", 1))


def buzz(at, length=0.45, gain=0.3, f0=170):
    n = int(length * SR)
    t = np.arange(n) / SR
    tone = np.sign(np.sin(2 * np.pi * f0 * t)) * 0.3 + np.sin(2 * np.pi * f0 / 2 * t) * 0.5
    gate = ((t * 6) % 1 < 0.6).astype(np.float32)
    e = np.minimum(1, t / 0.01) * np.minimum(1, (length - t) / 0.03)
    add(lowpass((tone * gate * e).astype(np.float32), 900), at, gain)


def sfx_buzzSwarm(c):
    # a whole town of phones buzzing at once
    at = T(c["at"])
    for k in range(9):
        buzz(at + rng.random() * 0.25, 0.5 + rng.random() * 0.4, 0.12, 150 + k * 9)
    # notification chime
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 1318 * t) + 0.6 * np.sin(2 * np.pi * 1975 * t)) * env(n, 0.005, 0.25)
    add(s.astype(np.float32), at + 0.05, 0.12)


def sfx_stinger(c):
    at, length = T(c["at"]), c.get("length", 2.4)
    n = int(length * SR)
    t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t * (1 + 0.02 * t)) for f in (440, 466.2, 622.3, 659.3, 880)) / 5
    add((s * (t / length) ** 2.5).astype(np.float32), at, 0.2)


def sfx_radioOn(c):
    at = T(c["at"])
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    click = noise(n) * env(n, 0.0005, 0.01)
    sweep = np.sin(2 * np.pi * np.cumsum(2000 - 1600 * t / 0.6) / SR) * env(n, 0.01, 0.15) * 0.4
    add(band(click + sweep.astype(np.float32), 200, 5000), at, 0.5)


def sfx_static(c):
    a, b = T(c["from"]), T(c["to"])
    n = int((b - a) * SR)
    t = np.arange(n) / SR
    s = band(noise(n), 600, 6000) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))
    f = np.minimum(1, t / 0.08) * np.minimum(1, (t[-1] - t + 1e-3) / 0.2)
    add((s * f).astype(np.float32), a, 0.25 * c.get("gain", 1))


def sfx_tap(c):
    at = T(c["at"])
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 900 * t) * env(n, 0.0005, 0.012) + noise(n) * env(n, 0.0005, 0.005) * 0.5
    add(band(s.astype(np.float32), 300, 6000), at, 0.55)


def sfx_creak(c):
    at, length = T(c["at"]), c.get("length", 1.0)
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 330 + 110 * np.sin(2 * np.pi * 1.4 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    grit = (rng.random(n) < 0.05).astype(np.float32)
    s = (np.sin(ph) * 0.3 + np.sin(2.01 * ph) * 0.15) * (0.4 + grit) * np.sin(np.pi * t / length)
    add(lowpass(s.astype(np.float32), 2200), at, 0.25)


def sfx_whoosh(c):
    at, length = T(c["at"]), c.get("length", 0.6)
    n = int(length * SR)
    t = np.arange(n) / SR
    add(lowpass(noise(n), 1800) * np.sin(np.pi * t / length) ** 2, at, 0.25)


def sfx_heartbeat(c):
    at, beats, bpm = T(c["at"]), c.get("beats", 6), c.get("bpm", 100)
    for k in range(beats):
        for off, g in ((0.0, 1.0), (0.18, 0.7)):
            n = int(0.25 * SR)
            t = np.arange(n) / SR
            add((np.sin(2 * np.pi * (55 - 20 * t) * t) * env(n, 0.005, 0.07)).astype(np.float32), at + k * 60 / bpm + off, 0.5 * g)


def sfx_powerDown(c):
    at = T(c["at"])
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f = 220 * np.exp(-t * 1.6) + 30
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2)
    add(s.astype(np.float32), at, 0.35)
    m = int(0.5 * SR)
    add((lowpass(noise(m), 600) * env(m, 0.001, 0.08)).astype(np.float32), at + 1.1, 0.6)


def sfx_thunder(c):
    at = T(c["at"])
    n = int(3.5 * SR)
    t = np.arange(n) / SR
    s = lowpass(noise(n), 160) * (env(n, 0.05, 1.2) + 0.5 * env(n, 0.4, 0.8))
    s += lowpass(noise(n), 1500) * env(n, 0.003, 0.15) * 0.4
    add(s.astype(np.float32), at, 0.9)


def sfx_impact(c):
    at = T(c["at"])
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (48 - 10 * t) * t) * env(n, 0.002, 0.8) + lowpass(noise(n), 800) * env(n, 0.001, 0.3)
    add(reverb(s.astype(np.float32)), at, 0.7)


def sfx_click(c):
    # flashlight / switch click
    at = T(c["at"])
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    s = noise(n) * env(n, 0.0003, 0.004) + np.sin(2 * np.pi * 2400 * t) * env(n, 0.0003, 0.006) * 0.5
    add(band(s.astype(np.float32), 800, 8000), at, 0.6)


def sfx_buzz(c):
    buzz(T(c["at"]), c.get("length", 0.45), c.get("gain", 0.35))


def sfx_riser(c):
    # rising filtered-noise swell into the end card
    at, length = T(c["at"]), c.get("length", 1.2)
    n = int(length * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(180 + 500 * (t / length) ** 2) / SR) * 0.4
    s = (band(noise(n), 300, 4000) * 0.6 + tone) * (t / length) ** 2
    add(s.astype(np.float32), at, 0.25)


def sfx_pop(c):
    # soft "UI pop" for animated text
    at = T(c["at"])
    n = int(0.15 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (520 - 900 * t) * t) * env(n, 0.002, 0.04)
    add(s.astype(np.float32), at, 0.3)


def sfx_tick(c):
    a, b = T(c["from"]), T(c["to"])
    k = 0
    while a + k * 0.5 < b - 0.1:
        n = int(0.06 * SR)
        t = np.arange(n) / SR
        f = 2000 if k % 2 == 0 else 1500
        add((np.sin(2 * np.pi * f * t) * env(n, 0.0005, 0.01)).astype(np.float32), a + k * 0.5, 0.18)
        k += 1


for c in cfg.get("sfx", []):
    globals()["sfx_" + c["type"]](c)

# ---------------- voices into the mix + timeline ----------------
timeline = []
for line, x, start, speech in rendered:
    add(x, start, 1.0)
    words = line["sub"].split()
    weights = []
    for w in words:
        wt = len(w.strip("“”\"")) + 1.5
        if w.endswith((",", ":")):
            wt += 3
        if w.endswith((".", "…", "?", "”", "!")):
            wt += 5
        weights.append(wt)
    tot = sum(weights)
    cur = start
    items = []
    for w, wt in zip(words, weights):
        d = speech * wt / tot
        items.append({"w": w, "start": round(cur * FPS), "end": round((cur + d) * FPS)})
        cur += d
    timeline.append({"id": line["id"], "voice": line["voice"], "text": line["sub"], "start": round(start * FPS),
                     "end": round((start + speech) * FPS), "noSubs": bool(line.get("noSubs")), "words": items})
    print(f"{line['id']:>4} {line['voice']:>8}: {start:6.2f}s -> {start + speech:6.2f}s")

mix = mix[:N]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.95 / np.abs(mix).max()
fade = int(0.5 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)

out_dir = os.path.join(ROOT, "public", "series", CH)
os.makedirs(out_dir, exist_ok=True)
with wave.open(os.path.join(out_dir, "soundtrack.wav"), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
tl_dir = os.path.join(ROOT, "src", "series", "chapters", CH)
os.makedirs(tl_dir, exist_ok=True)
json.dump({"durationInFrames": round(duration * FPS), "lines": timeline}, open(os.path.join(tl_dir, "timeline.json"), "w"), indent=1, ensure_ascii=False)
print(f"duration {duration:.2f}s ({round(duration * FPS)} frames) -> public/series/{CH}/soundtrack.wav")
