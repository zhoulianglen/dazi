import type { LessonId, Progress, Settings, View, SessionStats } from '../types';
import {
  loadProgress, saveProgress, loadSettings, saveSettings,
  appendStat, recordBest,
} from './persistence';
import { passesLesson, ALL_LESSON_IDS } from '../engine/lessons';

export type AppState = {
  view: View;
  currentLesson: LessonId;
  progress: Progress;
  settings: Settings;
  lastStats: SessionStats | null;
};

type Selector<T> = (s: AppState) => T;

export type Store = {
  get(): AppState;
  subscribe<T>(selector: Selector<T>, cb: (value: T) => void): () => void;
  setView(view: View): void;
  setLesson(id: LessonId): void;
  recordResult(stats: SessionStats): void;
  updateSettings(patch: Partial<Settings>): void;
};

export function createStore(): Store {
  let state: AppState = {
    view: 'idle',
    currentLesson: 8,
    progress: loadProgress(),
    settings: loadSettings(),
    lastStats: null,
  };

  type Sub<T> = { selector: Selector<T>; cb: (v: T) => void; last: T };
  const subs = new Set<Sub<unknown>>();

  function setState(patch: Partial<AppState>): void {
    state = { ...state, ...patch };
    for (const sub of subs) {
      const next = sub.selector(state);
      if (!Object.is(next, sub.last)) {
        sub.last = next;
        sub.cb(next);
      }
    }
  }

  function nextUnlockedFrom(progress: Progress, lessonId: LessonId): LessonId {
    if (lessonId >= 9) return progress.unlockedLesson;
    const candidate = (lessonId + 1) as LessonId;
    return Math.max(progress.unlockedLesson, candidate) as LessonId;
  }

  return {
    get: () => state,
    subscribe<T>(selector: Selector<T>, cb: (v: T) => void): () => void {
      const sub: Sub<T> = { selector, cb, last: selector(state) };
      subs.add(sub as Sub<unknown>);
      return () => subs.delete(sub as Sub<unknown>);
    },
    setView(view) { setState({ view }); },
    setLesson(id) {
      if (!ALL_LESSON_IDS.includes(id)) return;
      // All lessons are accessible. progress.unlockedLesson is kept as a
      // "highest passed" indicator for the picker, not a gate.
      setState({ currentLesson: id });
    },
    recordResult(stats) {
      let progress = recordBest(state.progress, stats.lessonId, stats.wpm, stats.acc);
      if (passesLesson(stats.lessonId, stats)) {
        progress = { ...progress, unlockedLesson: nextUnlockedFrom(progress, stats.lessonId) };
      }
      saveProgress(progress);
      appendStat(stats);
      setState({ progress, lastStats: stats, view: 'summary' });
    },
    updateSettings(patch) {
      const next = { ...state.settings, ...patch };
      saveSettings(next);
      setState({ settings: next });
    },
  };
}
