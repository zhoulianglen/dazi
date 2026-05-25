export type LessonId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Finger =
  | 'L-pinky' | 'L-ring' | 'L-mid' | 'L-index' | 'L-thumb'
  | 'R-thumb' | 'R-index' | 'R-mid' | 'R-ring' | 'R-pinky';

export type Progress = {
  unlockedLesson: LessonId;
  perLessonBest: Partial<Record<LessonId, { wpm: number; acc: number; at: number }>>;
};

export type SessionStats = {
  lessonId: LessonId;
  wpm: number;
  acc: number;
  durationMs: number;
  charsTyped: number;
  errorKeys: Record<string, number>;
  slowPairs: Array<{ from: string; to: string; meanMs: number; thresholdMs: number }>;
  timestamp: number;
};

export type Settings = {
  audioEnabled: boolean;
  audioVolume: number;
  reducedMotion: boolean;
};

export type EngineEvent =
  | { type: 'correct'; key: string; intervalMs: number; at: number }
  | { type: 'wrong'; expected: string; actual: string; at: number }
  | { type: 'finished'; stats: SessionStats };

export type View = 'idle' | 'practicing' | 'summary' | 'picker' | 'settings';
