"""
Builds the full soundtrack (narration + character voices + synthesized sound design)
and the subtitle timeline used by the Remotion composition.

Everything here is free and offline:
  - Voices: Piper TTS (MIT) with the free "ryan" and "lessac" English voices.
  - Sound effects: synthesized from scratch with numpy (no samples, no licenses).

Usage (only needed if you change the narration):
  python tools/make_audio.py <folder-with-piper-voices>
Outputs:
  public/soundtrack.wav
  src/timeline.json
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "voices")
SR = 44100
DUR = 30.0
FPS = 30

VOICE_MODELS = {
    "ryan": ("en-us-ryan-high.onnx", 0.92),
    "fake": ("en-us-lessac-medium.onnx", 1.1),
    "mom": ("en-us-lessac-medium.onnx", 0.95),
}

# Start time (seconds) of each spoken line. Checked for overlaps below.
STARTS = {
    "n1": 0.10,
    "n2": 3.60,
    "n3": 7.70,
    "m1": 10.15,
    "n4": 13.2,
    "n5": 17.25,
    "n6": 21.15,
    "m2": 23.95,
    "n7": 26.25,
}


def read_wav(path):
    with wave.open(path) as w:
        sr = w.getframerate()
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2:
            data = data.reshape(-1, 2).mean(axis=1)
    return data, sr


def resample(x, sr_in, sr_out):
    n = int(len(x) * sr_out / sr_in)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def trim(x, thresh=0.015):
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.02 * SR))
    b = min(len(x), idx[-1] + int(0.05 * SR))
    return x[a:b]


def lowpass(x, alpha):
    # one-pole low-pass filter (alpha small = darker)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += alpha * (x[i] - acc)
        y[i] = acc
    return y


def lowpass_fast(x, cutoff):
    # FFT brick-wall-ish low-pass, fast for long signals
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x)).astype(np.float32)


def reverb(x, taps=((0.045, 0.45), (0.083, 0.35), (0.127, 0.28), (0.191, 0.2), (0.263, 0.14))):
    out = np.concatenate([x, np.zeros(int(0.4 * SR), np.float32)])
    for t, g in taps:
        d = int(t * SR)
        out[d:d + len(x)] += x * g
    return out


def env(n, attack, decay):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)
    return e.astype(np.float32)


rng = np.random.default_rng(7)
mix = np.zeros(int(DUR * SR) + SR, np.float32)


def add(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(len(mix), i + len(sig))
    mix[i:j] += sig[: j - i] * gain


# ---------------- Sound design ----------------
def knock(at):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 95 * t) * env(n, 0.001, 0.06)
    body += 0.6 * np.sin(2 * np.pi * 180 * t) * env(n, 0.001, 0.03)
    click = rng.standard_normal(n).astype(np.float32) * env(n, 0.0005, 0.008)
    s = reverb((body + 0.5 * click).astype(np.float32))
    add(s, at, 0.9)


def buzz(at, length=0.55):
    n = int(length * SR)
    t = np.arange(n) / SR
    tone = np.sign(np.sin(2 * np.pi * 170 * t)) * 0.3 + np.sin(2 * np.pi * 85 * t) * 0.5
    gate = ((t * 6) % 1 < 0.6).astype(np.float32)
    e = np.minimum(1, t / 0.01) * np.minimum(1, (length - t) / 0.03)
    add(lowpass_fast((tone * gate * e).astype(np.float32), 900), at, 0.35)


def heartbeat(at, beats, bpm=96):
    for k in range(beats):
        for off, g in ((0.0, 1.0), (0.18, 0.7)):
            n = int(0.25 * SR)
            t = np.arange(n) / SR
            s = np.sin(2 * np.pi * (55 - 20 * t) * t) * env(n, 0.005, 0.07)
            add(s.astype(np.float32), at + k * 60 / bpm + off, 0.55 * g)


def whoosh(at, length=0.6, gain=0.25):
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n).astype(np.float32)
    shape = np.sin(np.pi * t / length) ** 2
    s = lowpass_fast(noise, 1800) * shape
    add(s.astype(np.float32), at, gain)


def slam(at):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (70 - 30 * t) * t) * env(n, 0.002, 0.25)
    s += lowpass_fast(rng.standard_normal(n).astype(np.float32), 2500) * env(n, 0.001, 0.12) * 0.8
    add(reverb(s.astype(np.float32)), at, 0.8)


def handle_creak(at, length=1.3):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 380 + 120 * np.sin(2 * np.pi * 1.3 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    grit = (rng.random(n) < 0.04).astype(np.float32)
    s = (np.sin(ph) * 0.3 + np.sin(2.01 * ph) * 0.15) * (0.4 + grit)
    e = np.sin(np.pi * t / length)
    add(lowpass_fast((s * e).astype(np.float32), 2200), at, 0.25)


def stinger(at, length=2.6):
    n = int(length * SR)
    t = np.arange(n) / SR
    s = np.zeros(n, np.float32)
    for f in (440, 466.2, 622.3, 659.3, 880):
        s += np.sin(2 * np.pi * f * t * (1 + 0.02 * t)).astype(np.float32)
    e = (t / length) ** 2.5
    add((s / 5 * e).astype(np.float32), at, 0.22)


def impact(at):
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (48 - 10 * t) * t) * env(n, 0.002, 0.8)
    s += lowpass_fast(rng.standard_normal(n).astype(np.float32), 800) * env(n, 0.001, 0.3)
    add(reverb(s.astype(np.float32)), at, 0.75)


# Ambient drone for the whole video (two detuned low sines + dark noise)
t_all = np.arange(len(mix)) / SR
drone = 0.5 * np.sin(2 * np.pi * 55 * t_all) + 0.4 * np.sin(2 * np.pi * 55.7 * t_all) + 0.2 * np.sin(2 * np.pi * 110.3 * t_all)
drone += lowpass_fast(rng.standard_normal(len(mix)).astype(np.float32), 220) * 1.2
swell = 0.55 + 0.45 * np.clip((t_all - 7) / 14, 0, 1)  # tension rises over time
swell *= np.where((t_all > 21.05) & (t_all < 21.7), 0.2, 1.0)  # breath after the door opens
mix += (drone * swell * 0.07).astype(np.float32)

buzz(0.0, 0.5)
whoosh(3.3)
knock(9.15)
knock(9.55)
knock(9.95)
whoosh(12.55)
buzz(18.95, 0.5)
handle_creak(17.0)
heartbeat(16.9, 7)
slam(21.05)
whoosh(25.5, 0.7, 0.3)
stinger(26.2, 2.75)
impact(28.95)

# ---------------- Voices ----------------
lines = json.load(open(os.path.join(ROOT, "tools", "lines.json")))
tmp = os.path.join(VOICES, "_render")
os.makedirs(tmp, exist_ok=True)
timeline = []
prev_end = 0
for line in lines:
    model, ls = VOICE_MODELS[line["voice"]]
    out = os.path.join(tmp, line["id"] + ".wav")
    subprocess.run(
        [sys.executable, "-m", "piper", "-m", os.path.join(VOICES, model), "-f", out,
         "--length-scale", str(ls), "--sentence-silence", "0.12"],
        input=line["text"].encode(), check=True, capture_output=True)
    x, sr = read_wav(out)
    if line["voice"] == "fake":
        # deeper, slower, echoing "not-quite-Mom" voice
        x = resample(x, sr, SR / 0.88)
        x = trim(x)
        speech = len(x) / SR
        x = reverb(x) * 0.9
    else:
        x = trim(resample(x, sr, SR))
        speech = len(x) / SR
        if line["voice"] == "mom":
            x = reverb(x, ((0.03, 0.2), (0.07, 0.1)))
    x = x / (np.abs(x).max() + 1e-6) * 0.8
    start = STARTS[line["id"]]
    dur = speech
    if start < prev_end:
        raise SystemExit(f"Line {line['id']} overlaps the previous line ({start:.2f} < {prev_end:.2f})")
    prev_end = start + dur
    add(x, start, 1.0)

    # Approximate word timing for karaoke subtitles (weighted by word length + pauses)
    words = line["sub"].split()
    weights = []
    for w in words:
        wt = len(w.strip("“”\"")) + 1.5
        if w.endswith((",", ":")):
            wt += 3
        if w.endswith((".", "…", "?", "”")):
            wt += 5
        weights.append(wt)
    total = sum(weights)
    cur = start
    word_items = []
    for w, wt in zip(words, weights):
        d = dur * wt / total
        word_items.append({"w": w, "start": round(cur * FPS), "end": round((cur + d) * FPS)})
        cur += d
    timeline.append({
        "id": line["id"], "voice": line["voice"], "text": line["sub"],
        "start": round(start * FPS), "end": round((start + dur) * FPS), "words": word_items,
    })
    print(f"{line['id']}: {start:.2f}s -> {start + dur:.2f}s")

if prev_end > DUR - 0.3:
    raise SystemExit("Narration runs past the end of the video")

mix = mix[: int(DUR * SR)]
# soft limiter
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.95 / np.abs(mix).max()
# fade out the last 0.4s
fade = int(0.4 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)

os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)
with wave.open(os.path.join(ROOT, "public", "soundtrack.wav"), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
json.dump(timeline, open(os.path.join(ROOT, "src", "timeline.json"), "w"), indent=1, ensure_ascii=False)
print("Wrote public/soundtrack.wav and src/timeline.json")
