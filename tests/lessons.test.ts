import { describe, it, expect } from 'vitest';
import {
  LESSONS, getLesson, pickText, passesLesson, ALL_LESSON_IDS,
} from '../src/engine/lessons';

describe('lessons', () => {
  it('contains 9 lessons', () => {
    expect(ALL_LESSON_IDS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(Object.keys(LESSONS)).toHaveLength(9);
  });

  it('each lesson has required fields', () => {
    for (const id of ALL_LESSON_IDS) {
      const l = getLesson(id);
      expect(l.id).toBe(id);
      expect(l.name.length).toBeGreaterThan(0);
      expect(l.allowedChars.length).toBeGreaterThan(0);
      expect(l.texts.length).toBeGreaterThan(0);
      expect(l.passWpm).toBeGreaterThan(0);
      expect(l.passAcc).toBeGreaterThan(0.9);
    }
  });

  it('lesson 1 covers only home-row keys', () => {
    const l = getLesson(1);
    for (const t of l.texts) {
      for (const c of t) {
        expect(l.allowedChars).toContain(c);
      }
    }
  });

  it('pickText returns one of the lesson texts deterministically given a seed', () => {
    const a = pickText(2, () => 0);
    const b = pickText(2, () => 0.999);
    expect(getLesson(2).texts).toContain(a);
    expect(getLesson(2).texts).toContain(b);
    expect(a).not.toBe(b);
  });

  it('passesLesson returns true only when both thresholds met', () => {
    expect(passesLesson(1, { wpm: 25, acc: 0.96 })).toBe(true);
    expect(passesLesson(1, { wpm: 25, acc: 0.94 })).toBe(false);
    expect(passesLesson(1, { wpm: 21, acc: 0.96 })).toBe(false);
  });

  it('pass thresholds are monotonically non-decreasing', () => {
    for (let i = 1; i < 9; i++) {
      const a = getLesson(i as 1).passWpm;
      const b = getLesson((i + 1) as 1).passWpm;
      expect(b).toBeGreaterThanOrEqual(a);
    }
  });

  it('every lesson text uses only chars in its allowedChars', () => {
    for (const id of ALL_LESSON_IDS) {
      const l = getLesson(id);
      const allowed = new Set(l.allowedChars);
      for (const text of l.texts) {
        for (const c of text) {
          if (!allowed.has(c)) {
            throw new Error(
              `L${id} text "${text}" uses char "${c}" not in allowedChars "${l.allowedChars}"`,
            );
          }
        }
      }
    }
  });

  it('each lesson has a nameKey matching its id', () => {
    for (const id of ALL_LESSON_IDS) {
      const l = getLesson(id);
      expect(l.nameKey).toBe(`lesson.${id}`);
    }
  });
});
