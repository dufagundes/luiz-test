"""
WHAT IF? - "What if a cow went grocery shopping?"  audio builder (free, offline, no samples).

Reads   tools/script.json
Writes  public/cow-shopping/soundtrack.wav   narration + music + sound effects, mixed and normalised
        src/timeline.json                    caption chunks with per-word timing

Voice:  Piper TTS (MIT) voice en-us-ryan-high (github.com/rhasspy/piper releases v0.0.2) -> put it in ./voices
Music + every sound effect are synthesised below with numpy/scipy (no third-party audio, no licences needed).

Usage:  python tools/build_audio.py [voices_dir]
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "voices")
SR = 44100
cfg = json.load(open(os.path.join(ROOT, "tools", "script.json"), encoding="utf-8"))
DUR = cfg["duration"]
N = int(DUR * SR)
rng = np.random.default_rng(11)
TMP = os.path.join(VOICES, "_cow")
os.makedirs(TMP, exist_ok=True)


# ============================================================== DSP helpers
def T(d):
    return np.arange(int(d * SR)) / SR


def noise(n):
    return rng.standard_normal(n).astype(np.float32)


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100) / (SR / 2), "low", output="sos"), x).astype(np.float32)


def hp(x, f, order=2):
    return sosfilt(butter(order, f / (SR / 2), "high", output="sos"), x).astype(np.float32)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], "band", output="sos"), x).astype(np.float32)


def env(n, a=0.005, d=0.2, sustain=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * (sustain + (1 - sustain) * np.exp(-t / d))
    return e.astype(np.float32)


def osc(freq, dur, kind="sine", phase=0.0):
    """freq can be a number or an array (glide)."""
    n = int(dur * SR)
    f = np.full(n, freq, np.float32) if np.isscalar(freq) else np.interp(np.linspace(0, 1, n), np.linspace(0, 1, len(freq)), freq)
    ph = 2 * np.pi * np.cumsum(f) / SR + phase
    if kind == "sine":
        return np.sin(ph).astype(np.float32)
    if kind == "tri":
        return (2 / np.pi * np.arcsin(np.sin(ph))).astype(np.float32)
    if kind == "square":
        return np.tanh(np.sin(ph) * 4).astype(np.float32)
    if kind == "saw":
        return (2 * ((ph / (2 * np.pi)) % 1) - 1).astype(np.float32)
    raise ValueError(kind)


def resonator(x, f, q=8):
    """2-pole resonant band-pass (formant)"""
    w = 2 * np.pi * f / SR
    r = np.exp(-w / (2 * q))
    b = [1 - r]
    a = [1, -2 * r * np.cos(w), r * r]
    return lfilter(b, a, x).astype(np.float32)


def place(track, x, t, gain=1.0):
    i = int(t * SR)
    if i >= len(track) or i + len(x) <= 0:
        return
    j = min(len(track), i + len(x))
    track[max(0, i):j] += gain * x[max(0, -i): j - i]


def norm(x, peak=1.0):
    m = np.abs(x).max()
    return x / m * peak if m > 0 else x


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ============================================================== narration (Piper)
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


def rms_curve(x, win=0.02):
    w = int(win * SR)
    pad = np.pad(x ** 2, (w // 2, w // 2))
    return np.sqrt(np.convolve(pad, np.ones(w) / w, mode="valid"))[: len(x)]


voice = np.zeros(N, np.float32)
voice_mask = np.zeros(N, np.float32)
chunks_out = []
for line in cfg["lines"]:
    parts = [c.strip() for c in line["text"].split("|") if c.strip()]
    spoken = " ".join(parts)
    out = os.path.join(TMP, line["id"] + ".wav")
    subprocess.run([sys.executable, "-m", "piper", "-m", os.path.join(VOICES, cfg["voice"]), "-f", out,
                    "--length-scale", str(line.get("lengthScale", cfg["lengthScale"])), "--sentence-silence", "0.1"],
                   input=spoken.encode(), check=True, capture_output=True)
    x, sr = read_wav(out)
    x = trim(resample(x, sr, SR))
    # radio-announcer polish: low cut, presence lift, gentle saturation
    x = hp(x, 80)
    x = x + 0.3 * bp(x, 2200, 6000)
    x = np.tanh(x * 1.8) / np.tanh(1.8)
    x = norm(x, 0.95)
    dur = len(x) / SR
    start = line["start"]
    end = start + dur
    nxt = [l["start"] for l in cfg["lines"] if l["start"] > start]
    if nxt and end > min(nxt) - 0.05:
        print(f"WARNING: line '{line['id']}' ({dur:.2f}s) overlaps the next line")
    place(voice, x, start)
    voice_mask[int(start * SR): int(end * SR)] = 1
    print(f"{line['id']:9s} {start:6.2f} -> {end:6.2f}  ({dur:.2f}s)")
    if not line.get("caption", True):
        continue
    # caption chunk boundaries: share by characters, snapped to the quietest nearby point
    rms = rms_curve(x)
    weights = np.array([len(c) + 3 for c in parts], dtype=float)
    bounds = [0.0]
    acc = 0.0
    for wgt in weights[:-1]:
        acc += wgt
        guess = acc / weights.sum() * dur
        lo, hi = int(max(0, guess - 0.25) * SR), int(min(dur, guess + 0.25) * SR)
        pen = rms[lo:hi] + 0.02 * np.abs(np.arange(lo, hi) / SR - guess)
        bounds.append(max((lo + int(np.argmin(pen))) / SR, bounds[-1] + 0.2))
    bounds.append(dur)
    for i, c in enumerate(parts):
        c0, c1 = bounds[i], bounds[i + 1]
        words = c.split()
        ww = np.array([len(w) + 1.5 for w in words])
        edges = np.concatenate([[0], np.cumsum(ww)]) / ww.sum() * (c1 - c0) + c0
        chunks_out.append({"text": c, "start": round(start + c0, 3), "end": round(start + c1, 3),
                           "words": [{"w": w, "start": round(start + edges[k], 3), "end": round(start + edges[k + 1], 3)}
                                     for k, w in enumerate(words)]})

# ============================================================== sound effects
sfx = np.zeros(N, np.float32)


def chime():  # automatic door "ding-dong"
    out = np.zeros(int(1.4 * SR), np.float32)
    for k, (f, t0) in enumerate([(1046.5, 0.0), (830.6, 0.32)]):
        n = int(1.0 * SR)
        tone = sum(a * np.sin(2 * np.pi * f * m * np.arange(n) / SR) for m, a in [(1, 1), (2.76, 0.3), (5.4, 0.12)])
        out[int(t0 * SR): int(t0 * SR) + n] += tone * env(n, 0.002, 0.35)
    return out * 0.5


def whoosh(d=0.5, lo=300, hi=3000, rise=True):
    n = int(d * SR)
    x = bp(noise(n), lo, hi)
    s = np.sin(np.linspace(0, np.pi, n)) ** (1.5 if rise else 0.8)
    return x * s * 0.6


def clop(heavy=0.0):  # hoof on tiles: woody "tok" + click
    n = int(0.12 * SR)
    f = 900 - 300 * heavy
    tok = np.sin(2 * np.pi * f * np.arange(n) / SR * (1 - 0.3 * np.arange(n) / n)) * env(n, 0.001, 0.025)
    click = hp(noise(n), 2500) * env(n, 0.0005, 0.006) * 0.5
    thump = np.sin(2 * np.pi * 70 * np.arange(n) / SR) * env(n, 0.002, 0.06) * heavy * 1.6
    return (tok * 0.6 + click + thump).astype(np.float32)


def rattle(d, amount=1.0):  # little wire-cart rattle
    n = int(d * SR)
    x = bp(noise(n), 1800, 7000)
    am = (rng.random(int(d * 40) + 2) ** 4)
    am = np.interp(np.linspace(0, len(am) - 1, n), np.arange(len(am)), am)
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.08 * SR))
    return x * am * fade * 0.35 * amount


def pop(f0=500, f1=1200, d=0.09):
    return osc(np.linspace(f0, f1, 50), d) * env(int(d * SR), 0.001, d / 3) * 0.7


def plonk():  # apple lands in basket
    n = int(0.25 * SR)
    return (osc(np.linspace(380, 240, 40), 0.25, "tri") * env(n, 0.001, 0.07) + bp(noise(n), 2000, 6000) * env(n, 0.001, 0.02) * 0.4) * 0.8


def crunch(d=0.22):
    n = int(d * SR)
    grains = np.zeros(n, np.float32)
    for _ in range(40):
        i = rng.integers(0, int(n * 0.7))
        g = hp(noise(400), 1500) * env(400, 0.0003, 0.002)
        grains[i:i + 400] += g * rng.uniform(0.3, 1)
    return (grains + lp(noise(n), 900) * env(n, 0.002, 0.05) * 0.5) * 0.8


def clang(f):  # tin can hit: inharmonic partials
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / dd) for r, a, dd in [(1, 1, 0.12), (2.32, 0.6, 0.08), (4.25, 0.4, 0.05), (6.1, 0.25, 0.03)])
    return (x + hp(noise(n), 3000) * env(n, 0.0005, 0.01)) * 0.35


def crash():
    out = np.zeros(int(1.6 * SR), np.float32)
    for i in range(16):
        t0 = 0.0 + (i / 16) ** 1.4 * 1.0 + rng.uniform(0, 0.05)
        place(out, clang(rng.uniform(900, 1700)) * rng.uniform(0.4, 1), t0)
    place(out, lp(noise(int(0.4 * SR)), 300) * env(int(0.4 * SR), 0.002, 0.12) * 0.9, 0)
    return out


def pizz(m, d=0.18):
    n = int(d * SR)
    return lp(osc(mtof(m), d, "saw"), 1800) * env(n, 0.002, 0.06) * 0.6


def sparkle():  # magical "ooh" discovery: shimmering arpeggio + soft choir pad
    out = np.zeros(int(1.8 * SR), np.float32)
    for i, m in enumerate([84, 88, 91, 96, 100]):
        n = int(0.9 * SR)
        place(out, np.sin(2 * np.pi * mtof(m) * np.arange(n) / SR) * env(n, 0.003, 0.25) * 0.25, i * 0.07)
    for m in [60, 64, 67, 72]:
        v = osc(mtof(m) * (1 + 0.004 * np.sin(np.linspace(0, 30, 200))), 1.8, "saw")
        v = resonator(v, 700, 4) * 0.6 + resonator(v, 1100, 5) * 0.4
        out += v * np.sin(np.linspace(0, np.pi, len(v))) * 0.05
    return out


def bass_hit():  # the dramatic "BWOMMM"
    d = 2.6
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 30 + 45 * np.exp(-t / 0.18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR)
    body = np.tanh(body * 2.2) * np.exp(-t / 0.9)
    boom = lp(noise(n), 160) * np.exp(-t / 0.25) * 1.2
    brass = lp(osc(np.full(50, 55.0), d, "saw") + osc(np.full(50, 82.4), d, "saw") * 0.7, 600) * np.exp(-t / 0.7) * 0.5
    return norm(body + boom + brass, 1.0).astype(np.float32)


def zoom_whoosh():
    n = int(0.35 * SR)
    x = bp(noise(n), 500, 6000) * (np.linspace(0, 1, n) ** 2)
    return x * 0.9


def ka_ching():  # cash register
    out = np.zeros(int(1.2 * SR), np.float32)
    place(out, hp(noise(int(0.06 * SR)), 1500) * env(int(0.06 * SR), 0.001, 0.015) * 0.8, 0)
    place(out, clang(1300) * 0.6, 0.02)
    n = int(1.0 * SR)
    bell = sum(a * np.sin(2 * np.pi * 2093 * r * np.arange(n) / SR) for r, a in [(1, 1), (2.4, 0.4), (3.9, 0.2)])
    place(out, bell * env(n, 0.001, 0.3) * 0.45, 0.12)
    return out


def twitch():
    return osc(np.linspace(1400, 2200, 20), 0.05, "square") * env(int(0.05 * SR), 0.001, 0.015) * 0.25


def gulp():
    n = int(0.25 * SR)
    x = osc(np.linspace(420, 160, 50), 0.25, "sine") * env(n, 0.005, 0.07)
    return (x + resonator(noise(n), 350, 6) * env(n, 0.002, 0.04) * 0.3) * 0.9


def slam():
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * np.cumsum(60 + 120 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.22)
    knock = bp(noise(n), 300, 2500) * np.exp(-t / 0.04)
    rattle_ = bp(noise(n), 3000, 9000) * np.exp(-t / 0.25) * 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * t))
    return norm(thud * 1.2 + knock * 0.9 + rattle_, 1.0)


def desk_bell():
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * 1760 * r * t) * np.exp(-t / dd) for r, a, dd in [(1, 1, 0.6), (2.71, 0.35, 0.3), (5.2, 0.15, 0.15)]) * 0.35


def boing():
    d = 0.4
    n = int(d * SR)
    f = 180 + 220 * np.abs(np.sin(np.linspace(0, 9, n))) * np.exp(-np.linspace(0, 4, n))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.15) * 0.6


def moo():
    """synthesised cow: pulse-train 'voice' through moving formants (m -> oo -> ooo)"""
    d = 1.9
    n = int(d * SR)
    t = np.arange(n) / SR
    f0 = np.interp(t, [0, 0.25, 0.7, 1.5, d], [120, 165, 172, 150, 105]) * (1 + 0.025 * np.sin(2 * np.pi * 5.5 * t))
    ph = np.cumsum(f0) / SR
    src = (2 * (ph % 1) - 1) + 0.6 * np.sign(np.sin(2 * np.pi * ph)) * 0.3
    src += 0.05 * noise(n)  # breath
    src = lp(src, 3500)
    open_ = np.interp(t, [0, 0.12, 0.25, d], [0, 0.3, 1, 1])  # lips open after the 'm'
    out = np.zeros(n, np.float32)
    for f, a, q in [(np.interp(t, [0, 0.25, d], [250, 380, 330]), 1.0, 6), (np.interp(t, [0, 0.25, d], [700, 900, 760]), 0.55, 8), (2500, 0.12, 10)]:
        # time-varying formant: process in blocks
        blk = 1024
        y = np.zeros(n, np.float32)
        for i in range(0, n, blk):
            fc = f if np.isscalar(f) else float(np.mean(f[i:i + blk]))
            y[i:i + blk] = resonator(src[max(0, i - 2048): i + blk], fc, q)[-len(src[i:i + blk]):]
        out += y * a
    nasal = lp(src, 400) * (1 - open_) * 0.8
    shape = np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.35)
    m = (out * open_ + nasal) * shape
    # a touch of room echo
    echo = np.zeros(n + int(0.18 * SR), np.float32)
    echo[:n] += m
    echo[int(0.18 * SR):] += m * 0.25
    return norm(echo, 1.0)


def party_horn():
    d = 0.7
    n = int(d * SR)
    f = np.interp(np.arange(n) / SR, [0, 0.12, d], [300, 520, 540])
    return lp(osc(f, d, "saw"), 3000) * env(n, 0.01, 0.5, 0.6) * np.minimum(1, (d - np.arange(n) / SR) / 0.05) * 0.35


def clap():
    n = int(0.08 * SR)
    return bp(noise(n), 900, 5000) * env(n, 0.0005, 0.018) * 0.5


def cowbell():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    x = (osc(587, 0.6, "square") + osc(845, 0.6, "square")) * np.exp(-t / 0.12)
    return bp(x, 500, 4000) * 0.4


def rimshot():  # ba-dum-tss
    out = np.zeros(int(1.6 * SR), np.float32)
    for k, (f, t0) in enumerate([(180, 0.0), (130, 0.17)]):
        n = int(0.3 * SR)
        tom = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-np.arange(n) / SR / 0.02))) / SR) * env(n, 0.001, 0.12)
        place(out, tom * 0.8, t0)
    n = int(1.2 * SR)
    place(out, hp(noise(n), 6000) * env(n, 0.001, 0.35) * 0.6, 0.36)
    return out


# ---- placement
place(sfx, chime(), 0.05, 0.5)
place(sfx, whoosh(0.7, 200, 2500), 0.1, 0.4)
for k, t0 in enumerate(np.arange(0.0, 3.35, 0.31)):
    place(sfx, clop(), t0 + 0.02 * (k % 2), 0.45)
place(sfx, rattle(3.3), 0.05, 0.9)
place(sfx, pop(400, 900), 4.12, 0.6)
place(sfx, whoosh(0.3, 800, 5000), 5.38, 0.4)
place(sfx, plonk(), 5.72, 0.8)
place(sfx, pop(700, 1400, 0.07), 6.12, 0.35)  # lettuce in hoof
for b in [7.0, 7.35, 7.7]:
    place(sfx, crunch(), b, 0.9)
place(sfx, whoosh(0.35, 400, 3000), 8.75, 0.5)  # tail whip
place(sfx, crash(), 9.0, 0.95)
for i, m in enumerate([72, 76, 72, 79]):  # sneaky tiptoe pizzicato
    place(sfx, pizz(m, 0.15), 10.25 + i * 0.13, 0.6)
for t0 in np.arange(10.8, 12.6, 0.36):
    place(sfx, clop(), t0, 0.4)
place(sfx, rattle(1.8, 0.8), 10.8, 0.8)
place(sfx, sparkle(), 12.15, 0.9)
place(sfx, pop(600, 300, 0.08), 13.6, 0.5)  # carton off the shelf
place(sfx, zoom_whoosh(), 16.15, 0.9)
place(sfx, bass_hit(), 16.48, 1.0)
place(sfx, ka_ching(), 19.5, 0.8)
for k in range(4):
    place(sfx, twitch(), 21.05 + k * 0.09, 0.7)
place(sfx, gulp(), 24.85, 0.9)
for t0 in np.arange(25.45, 30.5, 0.33):  # angry stomps
    place(sfx, clop(heavy=1.0), t0, 0.75)
place(sfx, rattle(5.0, 1.4), 25.45, 0.9)
place(sfx, whoosh(0.25, 300, 3000), 30.8, 0.4)
place(sfx, slam(), 31.05, 1.0)
place(sfx, desk_bell(), 31.12, 0.5)
place(sfx, boing(), 34.42, 0.8)
place(sfx, whoosh(0.35, 200, 1500), 35.8, 0.45)  # big inhale
place(sfx, moo(), 36.2, 1.0)
place(sfx, party_horn(), 36.3, 0.55)
place(sfx, party_horn(), 36.55, 0.4)
for t0 in np.arange(36.95, 39.3, 0.22):
    place(sfx, clap(), t0 + rng.uniform(-0.02, 0.02), 0.6)
place(sfx, whoosh(0.4, 400, 4000), 39.35, 0.5)
place(sfx, rimshot(), 39.6, 0.9)
place(sfx, cowbell(), 42.6, 0.8)
place(sfx, cowbell(), 42.82, 0.8)

# ============================================================== music (all synthesised)
music = np.zeros(N, np.float32)


def note(track, m, t0, d, kind="tri", vol=0.2, a=0.005, dec=None, lpf=None):
    n = int(d * SR)
    x = osc(mtof(m), d, kind) * env(n, a, dec or d * 0.5, 0.0)
    if lpf:
        x = lp(x, lpf)
    place(track, x, t0, vol)


def marimba(track, m, t0, vol=0.18):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    x = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.02)) * np.exp(-t / 0.18)
    place(track, x.astype(np.float32), t0, vol)


def hat(track, t0, vol=0.05):
    n = int(0.05 * SR)
    place(track, hp(noise(n), 7000) * env(n, 0.0005, 0.012), t0, vol)


def snare(track, t0, vol=0.18):
    n = int(0.18 * SR)
    place(track, (bp(noise(n), 1200, 7000) * env(n, 0.001, 0.05) + np.sin(2 * np.pi * 190 * np.arange(n) / SR) * env(n, 0.001, 0.03) * 0.6), t0, vol)


def kick(track, t0, vol=0.35):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    place(track, np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.12), t0, vol)


# A) bouncy shopping tune, 0 - 10.9 s (C major, 116 bpm, I-vi-IV-V)
bpm = 116
beat = 60 / bpm
chords = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [59, 62, 67])]
melody = [72, 76, 79, 76, 77, 76, 74, 72, 69, 72, 74, 76, 74, 72, 71, 74]
t = 0.0
bar = 0
while t < 10.9:
    root, triad = chords[bar % 4]
    for b in range(4):
        tb = t + b * beat
        if tb >= 10.9:
            break
        note(music, root if b % 2 == 0 else root + 7, tb, beat * 0.9, "tri", 0.32, dec=0.18, lpf=1200)
        if b % 2 == 1:
            for m in triad:
                note(music, m, tb, beat * 0.5, "square", 0.035, dec=0.08, lpf=2500)
        marimba(music, melody[(bar * 4 + b) % 16], tb, 0.16)
        marimba(music, melody[(bar * 4 + b + 2) % 16] + 12, tb + beat / 2, 0.07)
        hat(music, tb + beat / 2)
        if b in (0, 2):
            kick(music, tb, 0.22)
        else:
            snare(music, tb, 0.08)
    t += 4 * beat
    bar += 1
fade = np.ones(N, np.float32)
music[int(10.6 * SR): int(10.95 * SR)] *= np.linspace(1, 0, int(10.95 * SR) - int(10.6 * SR))
music[int(10.95 * SR): int(22.3 * SR)] = 0  # "But then..." -> the music stops; silence through the shock

# B) suspense: tremolo low strings 22.3 - 25.35
d = 3.05
tt = T(d)
trem = 0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt)
strings = sum(lp(osc(mtof(m), d, "saw"), 900) for m in [38, 45, 50, 51])
strings *= trem * np.minimum(1, tt / 0.8) * np.minimum(1, (d - tt) / 0.1)
place(music, strings * 0.12, 22.3)

# C) angry march 25.4 - 30.55 (D minor oom-pah, 132 bpm)
bpm = 132
beat = 60 / bpm
line = [50, 57, 50, 57, 53, 57, 52, 57, 50, 57, 50, 57, 46, 53, 45, 52]
t = 25.4
k = 0
while t < 30.5:
    m = line[k % len(line)]
    note(music, m - 12, t, beat * 0.8, "saw", 0.16, dec=0.12, lpf=500)  # tuba
    if k % 2 == 1:
        for c in [62, 65, 69]:
            note(music, c, t, beat * 0.35, "saw", 0.03, dec=0.05, lpf=1800)
    snare(music, t + beat / 2, 0.06)
    if k % 4 == 0:
        kick(music, t, 0.3)
    t += beat
    k += 1

# D) triumph 36.2 - 44 : brass stabs then a happy loop under the end card
for i, (t0, ms) in enumerate([(36.2, [60, 64, 67, 72]), (37.0, [62, 65, 69, 74]), (37.6, [64, 67, 72, 76]), (38.3, [65, 69, 72, 77])]):
    for m in ms:
        note(music, m, t0, 0.55 if i < 3 else 1.1, "saw", 0.05, a=0.02, dec=0.4, lpf=2600)
bpm = 120
beat = 60 / bpm
t = 39.4
bar = 0
while t < 43.9:
    root, triad = chords[bar % 4]
    for b in range(4):
        tb = t + b * beat
        if tb >= 43.9:
            break
        note(music, root if b % 2 == 0 else root + 7, tb, beat * 0.9, "tri", 0.26, dec=0.18, lpf=1200)
        marimba(music, melody[(bar * 4 + b + 5) % 16], tb, 0.12)
        hat(music, tb + beat / 2, 0.04)
    t += 4 * beat
    bar += 1
music[int(43.3 * SR):] *= np.linspace(1, 0, N - int(43.3 * SR))

# ============================================================== mix
# duck music under the narrator
duck = lp(voice_mask, 6)
duck = 1 - 0.55 * np.clip(duck * 1.2, 0, 1)
room = lp(noise(N), 500) * 0.004  # faint store room-tone so silences aren't "dead air"
mix = voice * 1.0 + music * duck * 0.9 + sfx * 0.8 + room
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = norm(mix, 0.93)
# tiny fades at both ends
mix[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
mix[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))

os.makedirs(os.path.join(ROOT, "public", "cow-shopping"), exist_ok=True)
out = os.path.join(ROOT, "public", "cow-shopping", "soundtrack.wav")
st = np.stack([mix, mix], axis=1)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
json.dump({"duration": DUR, "chunks": chunks_out}, open(os.path.join(ROOT, "src", "timeline.json"), "w"), indent=1)
print(f"wrote {out} ({DUR}s) and src/timeline.json ({len(chunks_out)} caption chunks)")
