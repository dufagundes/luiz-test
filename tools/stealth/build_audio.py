"""
Stealth bomber explainer: audio + timing builder (free, offline).

Reads   tools/stealth/script.json
Writes  public/stealth/soundtrack.wav     narration + music bed + sound effects, mixed and loudness-normalised
        src/stealth/timeline.json          frame-accurate line / subtitle-chunk / word timing + SFX cue times

Voice:  Piper TTS (MIT) voice en-us-ryan-high  (github.com/rhasspy/piper releases v0.0.2)
SFX + music: synthesised here with numpy (no samples, no licences).

Usage:  python tools/stealth/build_audio.py [voices_dir]
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOICES = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "voices")
SR = 44100
FPS = 30
cfg = json.load(open(os.path.join(ROOT, "tools", "stealth", "script.json")))
rng = np.random.default_rng(7)
TMP = os.path.join(VOICES, "_stealth")
os.makedirs(TMP, exist_ok=True)


# ---------------------------------------------------------------- helpers
def read_wav(path):
    with wave.open(path) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return x, sr


def resample(x, sr_in, sr_out):
    n = int(len(x) * sr_out / sr_in)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def trim(x, th=0.012):
    idx = np.where(np.abs(x) > th)[0]
    return x if len(idx) == 0 else x[max(0, idx[0] - int(0.015 * SR)): idx[-1] + int(0.04 * SR)]


def band(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / (1 + (f / hi) ** 4))
    return np.fft.irfft(X, len(x)).astype(np.float32)


def noise(n):
    return rng.standard_normal(n).astype(np.float32)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def envelope(n, a, d):
    t = np.arange(n) / SR
    return (np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)).astype(np.float32)


def rms_curve(x, win=0.02):
    w = int(win * SR)
    pad = np.pad(x ** 2, (w // 2, w // 2))
    c = np.sqrt(np.convolve(pad, np.ones(w) / w, mode="valid"))
    return c[: len(x)]


# ---------------------------------------------------------------- narration
lines_out = []
cursor = 0.0
voice_track = []
for line in cfg["lines"]:
    chunks = [c.strip() for c in line["text"].split("|") if c.strip()]
    spoken = " ".join(chunks)
    out = os.path.join(TMP, line["id"] + ".wav")
    subprocess.run([sys.executable, "-m", "piper", "-m", os.path.join(VOICES, cfg["voice"]), "-f", out,
                    "--length-scale", str(cfg["lengthScale"]), "--sentence-silence", "0.14"],
                   input=spoken.encode(), check=True, capture_output=True)
    x, sr = read_wav(out)
    x = trim(resample(x, sr, SR))
    # gentle "broadcast" polish: tiny low cut, presence lift, soft compression
    x = band(x, 70, 15000)
    x = x + 0.25 * band(x, 2500, 6000)
    x = np.tanh(x * 1.6) / np.tanh(1.6)
    x = x / (np.abs(x).max() + 1e-6) * 0.9
    dur = len(x) / SR
    start = cursor + line.get("gap", 0.3)
    cursor = start + dur

    # --- subtitle chunk timing: split by character share, then snap each boundary to the quietest
    # point nearby (pauses between phrases), so captions change exactly when the voice does.
    rms = rms_curve(x)
    weights = np.array([len(c) + 3 for c in chunks], dtype=float)
    bounds = [0.0]
    acc = 0.0
    for w in weights[:-1]:
        acc += w
        guess = acc / weights.sum() * dur
        lo, hi = int(max(0, guess - 0.28) * SR), int(min(dur, guess + 0.28) * SR)
        seg = rms[lo:hi]
        # prefer quiet points, lightly biased toward the guess
        pen = seg + 0.02 * np.abs(np.arange(lo, hi) / SR - guess)
        b = (lo + int(np.argmin(pen))) / SR
        bounds.append(max(b, bounds[-1] + 0.25))
    bounds.append(dur)
    chunk_out = []
    for i, c in enumerate(chunks):
        c0, c1 = bounds[i], bounds[i + 1]
        words = c.split()
        ww = np.array([len(w) + 1.5 for w in words])
        edges = np.concatenate([[0], np.cumsum(ww)]) / ww.sum() * (c1 - c0) + c0
        chunk_out.append({
            "text": c,
            "start": round(start + c0, 3),
            "end": round(start + c1, 3),
            "words": [{"w": w, "start": round(start + edges[k], 3), "end": round(start + edges[k + 1], 3)}
                      for k, w in enumerate(words)],
        })
    lines_out.append({"id": line["id"], "scene": line["scene"], "feature": line.get("feature"),
                      "start": round(start, 3), "end": round(cursor, 3), "chunks": chunk_out})
    voice_track.append((x, start))

TAIL = 1.6
duration = round((cursor + TAIL) * FPS) / FPS
print(f"narration ends at {cursor:.2f}s, video duration {duration:.2f}s")
if not (45 <= duration <= 60):
    print("WARNING: duration outside 45-60 s; adjust gaps / lengthScale in script.json")
N = int(duration * SR)
L = N + SR * 2
voice = np.zeros(L, np.float32)
for x, s in voice_track:
    i = int(s * SR)
    voice[i:i + len(x)] += x

starts = {l["id"]: l["start"] for l in lines_out}
ends = {l["id"]: l["end"] for l in lines_out}
scene_ids = [l["id"] for l in lines_out]

# Scene cuts happen a hair before each line so the picture leads the voice.
LEAD = 0.25
cuts = [0.0] + [starts[i] - LEAD for i in scene_ids[1:]]
# Each feature is ticked on the checklist as its explanation wraps up.
ticks = [round(ends[f"f{k}"] - 0.35, 3) for k in range(1, 6)]

# ---------------------------------------------------------------- sound design
sfx = np.zeros(L, np.float32)


def add(sig, at, gain=1.0, buf=None):
    buf = sfx if buf is None else buf
    i = max(0, int(at * SR))
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i] * gain


def boom(dur=2.2):
    t = t_axis(dur)
    f = 70 * np.exp(-t * 2.2) + 28
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 1.6)
    hit = band(noise(len(t)), 40, 900) * np.exp(-t * 7)
    return (body * 0.9 + hit * 0.6).astype(np.float32)


def whoosh(dur=0.55, lo=300, hi=5000):
    n = int(dur * SR)
    t = np.arange(n) / n
    x = noise(n)
    out = np.zeros(n, np.float32)
    # sweep a band through the noise in a few overlapping blocks
    blocks = 10
    for b in range(blocks):
        a, z = int(b * n / blocks), int((b + 1) * n / blocks)
        fc = lo * (hi / lo) ** (b / (blocks - 1))
        seg = band(x, fc * 0.6, fc * 1.6)[a:z]
        out[a:z] = seg
    shape = np.sin(np.pi * t) ** 2
    return (out * shape).astype(np.float32)


def jet_pass(dur=3.2):
    n = int(dur * SR)
    t = np.arange(n) / n
    roar = band(noise(n), 60, 2500)
    hiss = band(noise(n), 2500, 9000) * 0.35
    whine_f = 1900 * (1.0 + 0.12 * np.cos(np.pi * t))  # doppler drop
    whine = np.sin(2 * np.pi * np.cumsum(whine_f) / SR) * 0.06
    shape = np.exp(-((t - 0.45) / 0.22) ** 2)
    return ((roar + hiss + whine) * shape).astype(np.float32)


def ping(f=1150, dur=0.9):
    t = t_axis(dur)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 6) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 10)
    echo = np.zeros_like(x)
    d = int(0.18 * SR)
    echo[d:] = x[:-d] * 0.35
    return (x + echo).astype(np.float32)


def ding():
    t = t_axis(0.8)
    x = (np.sin(2 * np.pi * 988 * t) * np.exp(-t * 7) +
         0.7 * np.sin(2 * np.pi * 1480 * t) * np.exp(-t * 9) * (t > 0.07))
    return (x * np.minimum(1, t / 0.004)).astype(np.float32)


def riser(dur=1.6):
    t = t_axis(dur)
    f = 200 * (8 ** (t / dur))
    x = band(noise(len(t)), 500, 7000) * (t / dur) ** 2 * 0.6
    x += np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.12 * (t / dur) ** 2
    return x.astype(np.float32)


def thermal_hum(dur):
    t = t_axis(dur)
    x = band(noise(len(t)), 80, 400) * 0.5 + np.sin(2 * np.pi * 55 * t) * 0.15
    fade = np.minimum(1, np.minimum(t / 0.4, (dur - t) / 0.6))
    return (x * fade).astype(np.float32)


def clunk():
    t = t_axis(0.35)
    return (band(noise(len(t)), 60, 700) * np.exp(-t * 18) + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 14)).astype(np.float32)


# hook: impact + jet flyby
add(boom(), 0.0, 0.9)
add(jet_pass(3.4), 0.05, 0.55)
# radar pings in the hook (bird-sized blip) and the radar explainer
add(ping(1150), starts["hook"] + 2.6, 0.22)
for k in range(3):
    add(ping(1150 if k % 2 == 0 else 900), starts["radar"] + 0.3 + k * 1.55, 0.2)
# transitions
for c in cuts[1:]:
    add(whoosh(0.6), c - 0.3, 0.32)
# checklist ticks
for tk in ticks:
    add(ding(), tk, 0.28)
# feature-specific beats
add(ping(1300, 0.6), starts["f2"] + 2.0, 0.15)
add(ping(1300, 0.6), starts["f2"] + 3.0, 0.12)
add(thermal_hum(ends["f4"] - starts["f4"]), starts["f4"], 0.18)
add(clunk(), starts["f5"] + 1.3, 0.45)   # bay doors open
add(clunk(), ends["f5"] - 0.9, 0.45)     # bay doors close
# finale
add(riser(1.6), starts["together"] - 1.4, 0.3)
add(boom(1.8), starts["together"], 0.5)
add(jet_pass(4.0), starts["outro"] - 0.4, 0.35)
add(boom(2.0), starts["outro"] + 0.1, 0.35)

# ---------------------------------------------------------------- music bed
# Dark, driving cinematic pulse: 96 bpm, Am - F - C - G pad + sub pulse + soft ticks.
BPM = 96
beat = 60 / BPM
music = np.zeros(L, np.float32)
chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # midi


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


bar = 4 * beat
t_all = np.arange(L) / SR
n_bars = int(np.ceil(duration / bar)) + 1
for b in range(n_bars):
    ch = chords[b % 4]
    s = b * bar
    seg_t = t_axis(bar + 0.6)
    pad = np.zeros_like(seg_t)
    for m in ch:
        for det in (-0.12, 0.12):
            f = mtof(m + det) * 0.5
            pad += np.sign(np.sin(2 * np.pi * f * seg_t)) * 0.5 + np.sin(2 * np.pi * f * seg_t)
    pad = band(pad.astype(np.float32), 80, 1400) * 0.05
    pad *= np.minimum(1, np.minimum(seg_t / 0.3, np.maximum(0, (bar + 0.6 - seg_t)) / 0.6))
    add(pad, s, 1.0, music)
    root = mtof(ch[0] - 24)
    for k in range(8):  # eighth-note sub pulse
        tt = t_axis(beat / 2)
        sub = np.sin(2 * np.pi * root * tt) * envelope(len(tt), 0.005, 0.12)
        add(sub.astype(np.float32), s + k * beat / 2, 0.28 if k % 2 == 0 else 0.16, music)
    for k in range(4):  # soft hats on the off-beat
        tt = t_axis(0.08)
        hat = band(noise(len(tt)), 6000, 14000) * envelope(len(tt), 0.001, 0.015)
        add(hat, s + k * beat + beat / 2, 0.08, music)
# music is quiet under the hook's impact, then swells in; fades out at the end
mfade = np.clip((t_all - 0.6) / 1.5, 0, 1) * np.clip((duration - t_all) / 1.5, 0, 1)
music *= mfade.astype(np.float32)
# side-chain duck under the narration
venv = rms_curve(voice, 0.08)
duck = 1 - 0.55 * np.clip(venv / 0.08, 0, 1)
music *= duck.astype(np.float32)

mix = voice * 1.0 + music * 0.9 + sfx
mix = mix[:N]
mix = np.tanh(mix * 1.05) * 0.92
fade = np.clip((duration - np.arange(N) / SR) / 0.5, 0, 1)
mix = (mix * fade).astype(np.float32)

pub = os.path.join(ROOT, "public", "stealth")
os.makedirs(pub, exist_ok=True)
raw = os.path.join(TMP, "mix_raw.wav")
with wave.open(raw, "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
# loudness-normalise for social platforms (~ -14 LUFS), stereo 48 kHz
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af",
                "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "2",
                os.path.join(pub, "soundtrack.wav")], check=True)

timeline = {
    "fps": FPS,
    "duration": duration,
    "durationInFrames": int(round(duration * FPS)),
    "cuts": [round(c, 3) for c in cuts],
    "ticks": ticks,
    "lines": lines_out,
}
dst = os.path.join(ROOT, "src", "stealth", "timeline.json")
os.makedirs(os.path.dirname(dst), exist_ok=True)
json.dump(timeline, open(dst, "w"), indent=1)
for l in lines_out:
    print(f'{l["id"]:9s} {l["start"]:6.2f} -> {l["end"]:6.2f}')
print("wrote", dst)
