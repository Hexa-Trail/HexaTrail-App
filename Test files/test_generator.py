#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Use case : 
    python3 test_generator.py --out run_test_60s.csv --duration 60 --fs 500 --laps 8 --noise 0.8
    python3 test_generator.py --out run_test_15s.csv --duration 15 --fs 1000 --laps 3 --noise 0

"""
import argparse
import math
import random
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np


@dataclass
class Config:
    out: str
    duration_s: float
    fs_hz: float
    pot0_len_mm: float = 150.0
    pot1_len_mm: float = 100.0
    adc_max: int = 2047
    vmax_mm_s: float = 4000.0
    laps: int = 5
    seed: int = 42
    noise_mm: float = 0.6  # petit bruit corrélé (mm), optionnel


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def mm_to_counts(mm: np.ndarray, pot_len_mm: float, adc_max: int) -> np.ndarray:
    # mm -> [0..adc_max]
    counts = np.rint((mm / pot_len_mm) * adc_max).astype(int)
    return np.clip(counts, 0, adc_max)


def make_desired_profile(t: np.ndarray, seed: int) -> np.ndarray:
    """
    Génère une trajectoire normalisée p_des(t) dans [0..1] :
    - base sinusoïdale (roulage)
    - bumps (pics gaussiens)
    """
    rng = np.random.default_rng(seed)

    # Base : mélange de sinusoïdes (fréquences réalistes)
    p = 0.5 \
        + 0.22 * np.sin(2 * np.pi * 0.55 * t) \
        + 0.10 * np.sin(2 * np.pi * 1.70 * t + 0.8) \
        + 0.06 * np.sin(2 * np.pi * 3.10 * t + 1.7)

    # Bumps : impulsions gaussiennes aléatoires
    n_bumps = max(6, int(t[-1] * 1.2))
    bump_centers = rng.uniform(0.2, t[-1] - 0.2, size=n_bumps)
    bump_amps = rng.uniform(0.05, 0.18, size=n_bumps) * rng.choice([-1, 1], size=n_bumps, p=[0.25, 0.75])
    bump_sigmas = rng.uniform(0.03, 0.11, size=n_bumps)

    for c, a, s in zip(bump_centers, bump_amps, bump_sigmas):
        p += a * np.exp(-0.5 * ((t - c) / s) ** 2)

    # Clip brut
    p = np.clip(p, 0.0, 1.0)
    return p


def slew_rate_limit(p_des: np.ndarray, dt: float, max_dp_dt: float) -> np.ndarray:
    """
    Limite la dérivée de p(t) : |dp/dt| <= max_dp_dt.
    """
    p = np.empty_like(p_des)
    p[0] = p_des[0]
    max_step = max_dp_dt * dt

    for i in range(1, len(p_des)):
        dp = p_des[i] - p[i - 1]
        dp = clamp(dp, -max_step, max_step)
        p[i] = p[i - 1] + dp

    return np.clip(p, 0.0, 1.0)


def make_mark_signal(n: int, laps: int, seed: int) -> np.ndarray:
    """
    Mark = 1 sur un seul échantillon à chaque lap boundary (front montant).
    """
    rng = np.random.default_rng(seed + 123)
    if laps <= 0:
        return np.zeros(n, dtype=int)

    # Laps répartis sur la durée (avec un petit jitter)
    boundaries = np.linspace(0.15, 0.95, laps)  # en fraction
    boundaries += rng.normal(0, 0.01, size=laps)
    boundaries = np.clip(boundaries, 0.05, 0.98)

    idx = np.unique((boundaries * (n - 1)).astype(int))
    mark = np.zeros(n, dtype=int)
    mark[idx] = 1
    return mark


def generate_csv(cfg: Config) -> None:
    random.seed(cfg.seed)
    np.random.seed(cfg.seed)

    n = int(round(cfg.duration_s * cfg.fs_hz))
    if n < 2:
        raise ValueError("duration_s * fs_hz must produce at least 2 samples.")

    dt = 1.0 / cfg.fs_hz
    t = np.arange(n) * dt

    # p(t) normalisé
    p_des = make_desired_profile(t, cfg.seed)

    # Vitesse max sur p(t) pour respecter vmax sur le pot le plus long (150mm)
    # v0 = dp/dt * 150 <= 4000 => dp/dt <= 4000/150
    max_dp_dt = cfg.vmax_mm_s / max(cfg.pot0_len_mm, cfg.pot1_len_mm)
    p = slew_rate_limit(p_des, dt, max_dp_dt=max_dp_dt)

    # Pot positions en mm, cohérentes (même p), mais différentes car longueurs différentes
    pot0_mm = p * cfg.pot0_len_mm
    pot1_mm = p * cfg.pot1_len_mm

    # Petit bruit corrélé (optionnel) pour rendre le signal moins "parfait"
    if cfg.noise_mm > 0:
        rng = np.random.default_rng(cfg.seed + 999)
        common = rng.normal(0.0, cfg.noise_mm, size=n)  # bruit commun
        pot0_mm = np.clip(pot0_mm + common, 0.0, cfg.pot0_len_mm)
        pot1_mm = np.clip(pot1_mm + 0.8 * common, 0.0, cfg.pot1_len_mm)

    # Vérification vitesse (mm/s) — uniquement pour debug (pas obligatoire)
    v0 = np.diff(pot0_mm) / dt
    v1 = np.diff(pot1_mm) / dt
    if np.max(np.abs(v0)) > cfg.vmax_mm_s + 1e-6 or np.max(np.abs(v1)) > cfg.vmax_mm_s + 1e-6:
        raise RuntimeError("Velocity constraint violated (should not happen).")

    # Conversion en counts
    pot0_counts = mm_to_counts(pot0_mm, cfg.pot0_len_mm, cfg.adc_max)
    pot1_counts = mm_to_counts(pot1_mm, cfg.pot1_len_mm, cfg.adc_max)

    # Time_ms (comme ton fichier : commence à 1 et incrémente selon dt)
    time_ms = np.rint((t * 1000.0) + 1.0).astype(int)

    # Mark
    mark = make_mark_signal(n, cfg.laps, cfg.seed)

    # Écriture CSV
    with open(cfg.out, "w", encoding="utf-8") as f:
        f.write("Time_ms,PotA0,PotA1,Mark\n")
        for i in range(n):
            f.write(f"{time_ms[i]},{pot0_counts[i]},{pot1_counts[i]},{mark[i]}\n")

    print(f"✅ Generated: {cfg.out}")
    print(f"Samples: {n} | fs: {cfg.fs_hz} Hz | duration: {cfg.duration_s} s")
    print(f"Pot0 mm range: {pot0_mm.min():.2f} .. {pot0_mm.max():.2f}")
    print(f"Pot1 mm range: {pot1_mm.min():.2f} .. {pot1_mm.max():.2f}")
    print(f"Max |v0|: {np.max(np.abs(v0)):.1f} mm/s | Max |v1|: {np.max(np.abs(v1)):.1f} mm/s")


def main():
    ap = argparse.ArgumentParser(description="Generate HexaTrail test CSV (Time_ms, PotA0, PotA1, Mark)")
    ap.add_argument("--out", default="test_run.csv", help="Output CSV filename")
    ap.add_argument("--duration", type=float, default=60.0, help="Duration in seconds")
    ap.add_argument("--fs", type=float, default=500.0, help="Sampling frequency in Hz")
    ap.add_argument("--laps", type=int, default=6, help="Number of lap marks (Mark=1 pulses)")
    ap.add_argument("--seed", type=int, default=42, help="Random seed")
    ap.add_argument("--noise", type=float, default=0.6, help="Correlated noise in mm (0 disables)")
    args = ap.parse_args()

    cfg = Config(
        out=args.out,
        duration_s=args.duration,
        fs_hz=args.fs,
        laps=args.laps,
        seed=args.seed,
        noise_mm=args.noise
    )
    generate_csv(cfg)


if __name__ == "__main__":
    main()
