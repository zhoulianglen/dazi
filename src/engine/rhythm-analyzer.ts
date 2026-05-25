import { fingerOf } from './finger-map';
import type { SessionStats } from '../types';

const STRETCH_KEYS = new Set(['t', 'b', 'y', 'n', 'g', 'h']);

export function thresholdFor(prev: string, curr: string): number {
  const fPrev = fingerOf(prev);
  const fCurr = fingerOf(curr);
  if (!fPrev || !fCurr) return 250;

  const sameHand = fPrev[0] === fCurr[0]; // 'L' or 'R' prefix
  const sameFinger = fPrev === fCurr;
  const isStretch = STRETCH_KEYS.has(curr.toLowerCase());

  let base: number;
  if (isStretch) base = 220;          // stretch overrides same-finger penalty
  else if (!sameHand) base = 180;
  else if (sameFinger) base = 300;
  else base = 220;

  return base + (isStretch ? 40 : 0);
}

type Sample = { sumMs: number; count: number };

export class RhythmAnalyzer {
  private samples = new Map<string, Sample>(); // key = `${from}|${to}`

  observe(from: string, to: string, intervalMs: number): void {
    if (!from || intervalMs <= 0) return;
    const k = `${from}|${to}`;
    const s = this.samples.get(k) ?? { sumMs: 0, count: 0 };
    s.sumMs += intervalMs;
    s.count++;
    this.samples.set(k, s);
  }

  report(): SessionStats['slowPairs'] {
    const out: SessionStats['slowPairs'] = [];
    for (const [k, s] of this.samples) {
      if (s.count < 3) continue;
      const [from, to] = k.split('|');
      const meanMs = s.sumMs / s.count;
      const thresholdMs = thresholdFor(from, to);
      if (meanMs > thresholdMs) {
        out.push({ from, to, meanMs: Math.round(meanMs), thresholdMs });
      }
    }
    return out.sort((a, b) => (b.meanMs - b.thresholdMs) - (a.meanMs - a.thresholdMs));
  }

  reset(): void {
    this.samples.clear();
  }
}
