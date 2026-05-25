import { describe, it, expect } from 'vitest';
import { RhythmAnalyzer, thresholdFor } from '../src/engine/rhythm-analyzer';

describe('thresholdFor', () => {
  it('same finger same hand → 300ms', () => {
    expect(thresholdFor('a', 'q')).toBe(300); // both L-pinky
  });
  it('different hand → 180ms', () => {
    expect(thresholdFor('a', 'j')).toBe(180); // L-pinky → R-index
  });
  it('same hand different finger → 220ms', () => {
    expect(thresholdFor('a', 's')).toBe(220); // L-pinky → L-ring
  });
  it('index stretch (T or B) adds 40ms', () => {
    expect(thresholdFor('f', 't')).toBe(220 + 40); // L-index → L-index but T is stretch
    expect(thresholdFor('f', 'b')).toBe(220 + 40);
  });
  it('unknown pair falls back to 250ms', () => {
    expect(thresholdFor('§', 'a')).toBe(250);
  });
});

describe('RhythmAnalyzer', () => {
  it('returns empty slowPairs when no samples', () => {
    const a = new RhythmAnalyzer();
    expect(a.report()).toEqual([]);
  });

  it('flags pairs with mean above threshold (≥3 samples needed)', () => {
    const a = new RhythmAnalyzer();
    // L-pinky → R-pinky = different hand → 180ms threshold
    for (let i = 0; i < 4; i++) a.observe('a', 'p', 400);
    const report = a.report();
    expect(report.length).toBe(1);
    expect(report[0]).toMatchObject({ from: 'a', to: 'p', meanMs: 400, thresholdMs: 180 });
  });

  it('does not flag pairs with fewer than 3 samples', () => {
    const a = new RhythmAnalyzer();
    a.observe('a', 'p', 999);
    a.observe('a', 'p', 999);
    expect(a.report()).toEqual([]);
  });

  it('does not flag pairs at or under threshold', () => {
    const a = new RhythmAnalyzer();
    for (let i = 0; i < 5; i++) a.observe('a', 'j', 150);
    expect(a.report()).toEqual([]);
  });

  it('ignores the very first keystroke (interval 0)', () => {
    const a = new RhythmAnalyzer();
    a.observe('', 'a', 0);
    expect(a.report()).toEqual([]);
  });
});
