import type { EngineEvent, LessonId, SessionStats } from '../types';

type Listener = (e: EngineEvent) => void;

export class TypingEngine {
  private text = '';
  private lessonId: LessonId = 1;
  private cursor = 0;
  private correctCount = 0;
  private attemptCount = 0;
  private errorKeys: Record<string, number> = {};
  private startedAt: number | null = null;
  private lastKeyAt: number | null = null;
  private finished = false;
  private listeners = new Set<Listener>();
  private now: () => number;

  constructor(now: () => number = () => Date.now()) {
    this.now = now;
  }

  loadText(text: string, lessonId: LessonId): void {
    this.text = text;
    this.lessonId = lessonId;
    this.cursor = 0;
    this.correctCount = 0;
    this.attemptCount = 0;
    this.errorKeys = {};
    this.startedAt = null;
    this.lastKeyAt = null;
    this.finished = false;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(e: EngineEvent): void {
    for (const fn of this.listeners) fn(e);
  }

  handleKeydown(key: string): void {
    if (this.finished) return;
    if (key.length !== 1) return; // ignore modifier / arrow / etc.

    const t = this.now();
    if (this.startedAt === null) this.startedAt = t;
    const intervalMs = this.lastKeyAt === null ? 0 : t - this.lastKeyAt;
    this.lastKeyAt = t;
    this.attemptCount++;

    const expected = this.text[this.cursor];
    if (key === expected) {
      this.cursor++;
      this.correctCount++;
      this.emit({ type: 'correct', key, intervalMs, at: t });
      if (this.cursor >= this.text.length) {
        this.finished = true;
        this.emit({ type: 'finished', stats: this.buildStats(t) });
      }
    } else {
      this.errorKeys[expected] = (this.errorKeys[expected] ?? 0) + 1;
      this.emit({ type: 'wrong', expected, actual: key, at: t });
    }
  }

  private buildStats(endedAt: number): SessionStats {
    const durationMs = this.startedAt === null ? 0 : endedAt - this.startedAt;
    const minutes = durationMs / 60_000;
    const wpm = minutes > 0 ? Math.round(this.correctCount / 5 / minutes) : 0;
    const acc = this.attemptCount > 0 ? this.correctCount / this.attemptCount : 1;
    return {
      lessonId: this.lessonId,
      wpm,
      acc,
      durationMs,
      charsTyped: this.correctCount,
      errorKeys: { ...this.errorKeys },
      slowPairs: [], // populated by rhythm-analyzer
      timestamp: endedAt,
    };
  }

  getState(): { cursor: number; wpm: number; acc: number; errors: number; length: number } {
    const elapsed = this.startedAt === null ? 0 : this.now() - this.startedAt;
    const minutes = elapsed / 60_000;
    const wpm = minutes > 0 ? Math.round(this.correctCount / 5 / minutes) : 0;
    const acc = this.attemptCount > 0 ? this.correctCount / this.attemptCount : 1;
    return {
      cursor: this.cursor,
      wpm,
      acc,
      errors: this.attemptCount - this.correctCount,
      length: this.text.length,
    };
  }

  getText(): string { return this.text; }
}
