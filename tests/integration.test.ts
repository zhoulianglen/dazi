import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/state/store';
import { TypingEngine } from '../src/engine/typing-engine';
import { RhythmAnalyzer } from '../src/engine/rhythm-analyzer';

describe('integration: happy-path lesson 1', () => {
  beforeEach(() => localStorage.clear());

  it('typing a long lesson-1 text correctly unlocks lesson 2', () => {
    const store = createStore();
    let now = 1000;
    const engine = new TypingEngine(() => now);
    const analyzer = new RhythmAnalyzer();
    const text = 'asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl;'; // 60 chars
    engine.loadText(text, 1);

    let prev = '';
    engine.subscribe((e) => {
      if (e.type === 'correct') { analyzer.observe(prev, e.key, e.intervalMs); prev = e.key; }
      if (e.type === 'finished') {
        store.recordResult({ ...e.stats, slowPairs: analyzer.report() });
      }
    });

    for (const c of text) {
      now += 100; // 0.1s per key → 60 chars / 6s → 120 wpm
      engine.handleKeydown(c);
    }

    expect(store.get().progress.unlockedLesson).toBe(2);
    expect(store.get().lastStats?.wpm).toBeGreaterThanOrEqual(22);
    expect(store.get().lastStats?.acc).toBe(1);
  });

  it('typing with many errors does not unlock', () => {
    const store = createStore();
    let now = 1000;
    const engine = new TypingEngine(() => now);
    engine.loadText('aaaa', 1);
    engine.subscribe((e) => {
      if (e.type === 'finished') store.recordResult({ ...e.stats, slowPairs: [] });
    });
    for (let i = 0; i < 4; i++) {
      now += 200;
      engine.handleKeydown('x'); // wrong
      now += 200;
      engine.handleKeydown('a'); // correct
    }
    expect(store.get().progress.unlockedLesson).toBe(1);
  });
});
