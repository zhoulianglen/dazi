import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '../src/state/store';

describe('store', () => {
  beforeEach(() => localStorage.clear());

  it('initializes from persistence defaults', () => {
    const s = createStore();
    expect(s.get().view).toBe('idle');
    expect(s.get().currentLesson).toBe(8);
    expect(s.get().progress.unlockedLesson).toBe(1);
  });

  it('setView triggers subscribers', () => {
    const s = createStore();
    const fn = vi.fn();
    s.subscribe(state => state.view, fn);
    s.setView('practicing');
    expect(fn).toHaveBeenCalledWith('practicing');
  });

  it('selector does not fire when unrelated slice changes', () => {
    const s = createStore();
    const fn = vi.fn();
    s.subscribe(state => state.view, fn);
    s.setLesson(2);
    expect(fn).not.toHaveBeenCalled();
  });

  it('setLesson accepts any valid LessonId (no gating)', () => {
    const s = createStore();
    expect(s.get().progress.unlockedLesson).toBe(1);
    s.setLesson(5);
    expect(s.get().currentLesson).toBe(5);
    s.setLesson(9);
    expect(s.get().currentLesson).toBe(9);
  });

  it('recordResult unlocks next lesson on pass and persists', () => {
    const s = createStore();
    s.recordResult({
      lessonId: 1, wpm: 30, acc: 0.97, durationMs: 1000,
      charsTyped: 30, errorKeys: {}, slowPairs: [], timestamp: 1,
    });
    expect(s.get().progress.unlockedLesson).toBe(2);
    // reload from a fresh store
    const s2 = createStore();
    expect(s2.get().progress.unlockedLesson).toBe(2);
  });

  it('recordResult below threshold does not unlock', () => {
    const s = createStore();
    s.recordResult({
      lessonId: 1, wpm: 10, acc: 0.99, durationMs: 1000,
      charsTyped: 10, errorKeys: {}, slowPairs: [], timestamp: 1,
    });
    expect(s.get().progress.unlockedLesson).toBe(1);
  });

  it('updateSettings persists across reload', () => {
    const s = createStore();
    s.updateSettings({ audioEnabled: true });
    const s2 = createStore();
    expect(s2.get().settings.audioEnabled).toBe(true);
  });
});
