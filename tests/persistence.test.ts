import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadProgress, saveProgress,
  loadSettings, saveSettings,
  loadStats, appendStat,
  exportAll, importAll,
  PROGRESS_KEY, SETTINGS_KEY,
} from '../src/state/persistence';

describe('persistence', () => {
  beforeEach(() => localStorage.clear());

  it('returns default progress when storage is empty', () => {
    const p = loadProgress();
    expect(p.unlockedLesson).toBe(1);
    expect(p.perLessonBest).toEqual({});
  });

  it('round-trips progress', () => {
    saveProgress({ unlockedLesson: 3, perLessonBest: { 1: { wpm: 30, acc: 0.97, at: 1 } } });
    const p = loadProgress();
    expect(p.unlockedLesson).toBe(3);
    expect(p.perLessonBest[1]?.wpm).toBe(30);
  });

  it('returns default settings', () => {
    const s = loadSettings();
    expect(s.audioEnabled).toBe(false);
    expect(s.audioVolume).toBeGreaterThan(0);
    expect(s.reducedMotion).toBe(false);
  });

  it('appends stats and caps at 200 entries', () => {
    for (let i = 0; i < 250; i++) {
      appendStat({
        lessonId: 1, wpm: 20, acc: 0.9, durationMs: 60000,
        charsTyped: 100, errorKeys: {}, slowPairs: [], timestamp: i,
      });
    }
    expect(loadStats()).toHaveLength(200);
    expect(loadStats()[0].timestamp).toBe(50);
  });

  it('export bundles all three keys with schema version', () => {
    saveProgress({ unlockedLesson: 2, perLessonBest: {} });
    const blob = exportAll();
    expect(blob.schema).toBe('dazi.v1');
    expect(blob.progress.unlockedLesson).toBe(2);
  });

  it('import overwrites localStorage when schema matches', () => {
    importAll({
      schema: 'dazi.v1',
      progress: { unlockedLesson: 5, perLessonBest: {} },
      settings: { audioEnabled: true, audioVolume: 0.5, reducedMotion: false, locale: 'zh' as const },
      stats: [],
    });
    expect(loadProgress().unlockedLesson).toBe(5);
    expect(loadSettings().audioEnabled).toBe(true);
  });

  it('import throws on schema mismatch', () => {
    expect(() => importAll({ schema: 'dazi.v999', progress: {} as any, settings: {} as any, stats: [] }))
      .toThrow(/schema/i);
  });

  it('uses expected localStorage keys', () => {
    saveProgress({ unlockedLesson: 1, perLessonBest: {} });
    expect(localStorage.getItem(PROGRESS_KEY)).not.toBeNull();
    saveSettings({ audioEnabled: false, audioVolume: 0.5, reducedMotion: false, locale: 'zh' });
    expect(localStorage.getItem(SETTINGS_KEY)).not.toBeNull();
  });
});
