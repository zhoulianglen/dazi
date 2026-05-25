import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TypingEngine } from '../src/engine/typing-engine';
import type { EngineEvent } from '../src/types';

describe('TypingEngine', () => {
  let engine: TypingEngine;
  let events: EngineEvent[];
  let now: number;

  beforeEach(() => {
    now = 1000;
    engine = new TypingEngine(() => now);
    events = [];
    engine.subscribe((e) => events.push(e));
  });

  it('starts at cursor 0 and 0 WPM/ACC', () => {
    engine.loadText('abc', 1);
    expect(engine.getState().cursor).toBe(0);
    expect(engine.getState().wpm).toBe(0);
    expect(engine.getState().acc).toBe(1);
  });

  it('advances cursor on correct key and emits "correct"', () => {
    engine.loadText('ab', 1);
    engine.handleKeydown('a');
    expect(engine.getState().cursor).toBe(1);
    expect(events.filter(e => e.type === 'correct')).toHaveLength(1);
  });

  it('does not advance on wrong key and emits "wrong"', () => {
    engine.loadText('ab', 1);
    engine.handleKeydown('x');
    expect(engine.getState().cursor).toBe(0);
    const wrong = events.find(e => e.type === 'wrong');
    expect(wrong).toMatchObject({ type: 'wrong', expected: 'a', actual: 'x' });
  });

  it('emits "finished" with stats when all chars typed', () => {
    engine.loadText('ab', 1);
    engine.handleKeydown('a');
    now += 60_000; // 60s later
    engine.handleKeydown('b');
    const finished = events.find(e => e.type === 'finished');
    expect(finished?.type).toBe('finished');
    if (finished?.type === 'finished') {
      expect(finished.stats.charsTyped).toBe(2);
      expect(finished.stats.acc).toBe(1);
      expect(finished.stats.durationMs).toBe(60_000);
    }
  });

  it('computes WPM as chars/5 per minute', () => {
    engine.loadText('abcdefghij', 1); // 10 chars
    for (const c of 'abcdefghij') {
      now += 6000; // 6s per char → 60s total → 10/5=2 wpm
      engine.handleKeydown(c);
    }
    const finished = events.find(e => e.type === 'finished');
    if (finished?.type !== 'finished') throw new Error('not finished');
    expect(finished.stats.wpm).toBe(2);
  });

  it('computes accuracy as correct / total attempts', () => {
    engine.loadText('ab', 1);
    engine.handleKeydown('x');  // wrong at 'a', errorKeys['a']++
    engine.handleKeydown('a');  // correct, cursor → 1
    engine.handleKeydown('y');  // wrong at 'b', errorKeys['b']++
    engine.handleKeydown('b');  // correct, finished
    const finished = events.find(e => e.type === 'finished');
    if (finished?.type !== 'finished') throw new Error('not finished');
    expect(finished.stats.acc).toBeCloseTo(0.5, 5);
    expect(finished.stats.errorKeys['a']).toBe(1);
    expect(finished.stats.errorKeys['b']).toBe(1);
  });

  it('ignores keys longer than one char (modifier keys, etc.)', () => {
    engine.loadText('ab', 1);
    engine.handleKeydown('Shift');
    engine.handleKeydown('ArrowLeft');
    expect(engine.getState().cursor).toBe(0);
    expect(events).toHaveLength(0);
  });

  it('intervalMs in "correct" event is elapsed since previous keystroke', () => {
    engine.loadText('ab', 1);
    engine.handleKeydown('a');
    now += 250;
    engine.handleKeydown('b');
    const corrects = events.filter(e => e.type === 'correct') as Extract<EngineEvent, {type:'correct'}>[];
    expect(corrects[1].intervalMs).toBe(250);
  });

  it('does not emit further events after finish', () => {
    engine.loadText('a', 1);
    engine.handleKeydown('a');
    const before = events.length;
    engine.handleKeydown('a');
    expect(events.length).toBe(before);
  });

  it('unsubscribe stops delivery', () => {
    engine.loadText('a', 1);
    const fn = vi.fn();
    const off = engine.subscribe(fn);
    off();
    engine.handleKeydown('a');
    expect(fn).not.toHaveBeenCalled();
  });
});
