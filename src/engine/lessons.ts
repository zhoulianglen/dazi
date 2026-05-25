import type { LessonId } from '../types';

export type Lesson = {
  id: LessonId;
  name: string;
  allowedChars: string;
  texts: string[];
  passWpm: number;
  passAcc: number;
};

export const ALL_LESSON_IDS: LessonId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const LESSONS: Record<LessonId, Lesson> = {
  1: {
    id: 1, name: 'Home Row', passWpm: 22, passAcc: 0.95,
    allowedChars: 'asdfjkl; ',
    texts: [
      'asdf jkl; asdf jkl; asdf jkl; asdf jkl;',
      'sad lads fall ask jak dad lass flask',
      'all jaks sad falls ask dad lad flask',
      'flask lads fall ask jak sad dad lass',
    ],
  },
  2: {
    id: 2, name: '+ E I', passWpm: 24, passAcc: 0.95,
    allowedChars: 'asdfjkl;ei ',
    texts: [
      'led said file like idea died slide',
      'eel did kid lie sake jade fade idle',
      'leak deal sake said kid eel idle slide',
    ],
  },
  3: {
    id: 3, name: '+ R U', passWpm: 26, passAcc: 0.95,
    allowedChars: 'asdfjkl;eiru ',
    texts: [
      'rude rusk askirure dare slur rural ruler',
      'ruler usual rare urea risk ruse drier',
      'rural drier risk ruler rare rusk slur',
    ],
  },
  4: {
    id: 4, name: '+ G H', passWpm: 28, passAcc: 0.95,
    allowedChars: 'asdfjkl;eirugh ',
    texts: [
      'high rage huge sigh gear haul gauge laugh',
      'glad sigh high haul drag huge guru gulag',
      'gauge laugh gear sigh huge drag high haul',
    ],
  },
  5: {
    id: 5, name: 'Top Row Complete', passWpm: 30, passAcc: 0.95,
    allowedChars: 'asdfjkl;qwertyuiop ',
    texts: [
      'quote write quiet power equity typing trophy poetry',
      'a quirky proxy upset our weekly query report',
      'pretty quiet typewriter properly outputs upper queue',
    ],
  },
  6: {
    id: 6, name: 'Bottom Row', passWpm: 32, passAcc: 0.95,
    allowedChars: 'asdfjkl;qwertyuiopzxcvbnm,./ ',
    texts: [
      'maximize zone, fix the box; verify many objects',
      'jazz mob, vex calm, brick zone exactly objective',
      'maybe vivid zebra crosses bumpy lazy field x.',
    ],
  },
  7: {
    id: 7, name: 'Numbers Row', passWpm: 34, passAcc: 0.95,
    allowedChars: 'asdfjkl;qwertyuiopzxcvbnm,./0123456789 ',
    texts: [
      'order 4 cubes, 23 spheres, 18 cones, 506 prisms',
      'flight 374 departs at 1815 from gate 27a',
      'we shipped 1024 units in q2, up 36% from 750',
    ],
  },
  8: {
    id: 8, name: 'Punctuation + Shift', passWpm: 36, passAcc: 0.95,
    allowedChars:
      "asdfjkl;qwertyuiopzxcvbnm,./0123456789ASDFJKLQWERTYUIOPZXCVBNM:'\"!?- ",
    texts: [
      'Quick! Pay attention: "Brevity is the soul of wit."',
      'It\'s 9:42 AM - she said, "Don\'t be late!"',
      'Mr. Lee asked, "Where are the reports? I need them today!"',
    ],
  },
  9: {
    id: 9, name: 'Free Text (Programmer)', passWpm: 40, passAcc: 0.95,
    allowedChars:
      "asdfjkl;qwertyuiopzxcvbnm,./0123456789ASDFJKLQWERTYUIOPZXCVBNM:'\"!?-_=+(){}[]<>*&^%$#@ ",
    texts: [
      'const sum = (a, b) => a + b; // returns sum',
      'if (user && user.isActive) { return user.name; }',
      'function map(arr, fn) { return arr.map(fn); }',
      'The quick brown fox jumps over the lazy dog.',
      'git commit -m "feat: add reactive store"',
    ],
  },
};

export function getLesson(id: LessonId): Lesson {
  return LESSONS[id];
}

export function pickText(id: LessonId, rng: () => number = Math.random): string {
  const { texts } = LESSONS[id];
  const i = Math.floor(rng() * texts.length);
  return texts[Math.min(i, texts.length - 1)];
}

export function passesLesson(
  id: LessonId,
  result: { wpm: number; acc: number },
): boolean {
  const l = LESSONS[id];
  return result.wpm >= l.passWpm && result.acc >= l.passAcc;
}
