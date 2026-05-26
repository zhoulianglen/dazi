import type { Progress, Settings, SessionStats, LessonId } from '../types';

export const SCHEMA = 'dazi.v1';
export const PROGRESS_KEY = 'dazi.progress.v1';
export const SETTINGS_KEY = 'dazi.settings.v1';
export const STATS_KEY    = 'dazi.stats.v1';
const STATS_CAP = 200;

const DEFAULT_PROGRESS: Progress = { unlockedLesson: 1, perLessonBest: {} };
const DEFAULT_SETTINGS: Settings = { audioEnabled: false, audioVolume: 0.5, reducedMotion: false, locale: 'zh' };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadProgress(): Progress {
  return readJson(PROGRESS_KEY, DEFAULT_PROGRESS);
}
export function saveProgress(p: Progress): boolean {
  return writeJson(PROGRESS_KEY, p);
}

export function loadSettings(): Settings {
  return readJson(SETTINGS_KEY, DEFAULT_SETTINGS);
}
export function saveSettings(s: Settings): boolean {
  return writeJson(SETTINGS_KEY, s);
}

export function loadStats(): SessionStats[] {
  return readJson(STATS_KEY, []);
}
export function appendStat(s: SessionStats): boolean {
  const list = loadStats();
  list.push(s);
  while (list.length > STATS_CAP) list.shift();
  return writeJson(STATS_KEY, list);
}

export type ExportBlob = {
  schema: string;
  progress: Progress;
  settings: Settings;
  stats: SessionStats[];
};

export function exportAll(): ExportBlob {
  return {
    schema: SCHEMA,
    progress: loadProgress(),
    settings: loadSettings(),
    stats: loadStats(),
  };
}

export function importAll(blob: ExportBlob): void {
  if (blob.schema !== SCHEMA) {
    throw new Error(`Incompatible schema: expected ${SCHEMA}, got ${blob.schema}`);
  }
  saveProgress(blob.progress);
  saveSettings(blob.settings);
  writeJson(STATS_KEY, blob.stats.slice(-STATS_CAP));
}

// helper used by store when recording a session result
export function recordBest(
  progress: Progress,
  lessonId: LessonId,
  wpm: number,
  acc: number,
): Progress {
  const prior = progress.perLessonBest[lessonId];
  if (!prior || wpm > prior.wpm) {
    return {
      ...progress,
      perLessonBest: { ...progress.perLessonBest, [lessonId]: { wpm, acc, at: Date.now() } },
    };
  }
  return progress;
}
