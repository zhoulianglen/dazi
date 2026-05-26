import type { LessonId } from '../types';

export type Lesson = {
  id: LessonId;
  name: string;
  nameKey: string;
  allowedChars: string;
  texts: string[];
  passWpm: number;
  passAcc: number;
};

export const ALL_LESSON_IDS: LessonId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const LESSONS: Record<LessonId, Lesson> = {
  1: {
    id: 1, name: 'Home Row', nameKey: 'lesson.1', passWpm: 22, passAcc: 0.95,
    allowedChars: 'asdfjkl; ',
    texts: [
      // word drills
      'asdf jkl; asdf jkl; asdf jkl; asdf jkl;',
      'sad lads fall ask jak dad lass flask',
      'all jaks sad falls ask dad lad flask',
      'flask lads fall ask jak sad dad lass',
      // real sentences (only a s d f j k l ; space)
      'a lad asks dad; fall lads; jak flask falls',
      'sad lass asks; dad falls; flask salads all lads',
      'all sad lads ask jak; dad falls; lass flask',
      'jak sad fall; lad asks flask; lass dad skald',
      'flask flask flask; dad asks lass; all jaks fall',
      'skald jaks; sad lass fall; dad asks all lads',
    ],
  },
  2: {
    id: 2, name: '+ E I', nameKey: 'lesson.2', passWpm: 24, passAcc: 0.95,
    allowedChars: 'asdfjkl;ei ',
    texts: [
      // word drills
      'led said file like idea died slide',
      'eel did kid lie sake jade fade idle',
      'leak deal sake said kid eel idle slide',
      'aide idea isle side lake file dial',
      // real sentences (only a s d f j k l ; e i space)
      'slide a file aside; ideal lass said like',
      'a sad kid; ideal file leaks; said jade silk',
      'eel said; slide jade aside; lad likes field',
      'is a fake dial; silk file aside; lake said leak',
      'like a kid; jade idea fails; said lass filed silk',
      'idea fled; like sail; jade aside; silk eel said a deal',
    ],
  },
  3: {
    id: 3, name: '+ R U', nameKey: 'lesson.3', passWpm: 26, passAcc: 0.95,
    allowedChars: 'asdfjkl;eiru ',
    texts: [
      // word drills
      'rude rusk ruler dare slur rural rule',
      'ruler usual rare urea risk ruse drier',
      'rural drier risk ruler rare rusk slur',
      'rile fire lure ride sure fuel duel',
      // real sentences (only a s d f j k l ; e i r u space)
      'a rude lad likes rural lair; sure fire',
      'ruler said rule; slur risk; usual fire is lair',
      'rural ruse failed; drier air is ideal; sure jade rule',
      'a slur like sure fire; ruled lair slide; rude idea',
      'ride a rural lure; sure fire ruse; jade like a ruler',
      'usual risk ruled; fire; drier ruse; lair sealed a deal',
    ],
  },
  4: {
    id: 4, name: '+ G H', nameKey: 'lesson.4', passWpm: 28, passAcc: 0.95,
    allowedChars: 'asdfjkl;eirugh ',
    texts: [
      // word drills
      'high rage huge sigh gear haul gauge laugh',
      'glad sigh high haul drag huge guru gulag',
      'gauge laugh gear sigh huge drag high haul',
      'gush hire hair grudge hike guard guide lug',
      // real sentences (only a s d f j k l ; e i r u g h space)
      'huge sigh; high gauge; glad lad gulag laugh drag hair',
      'a huge grudge; girl did hire a guide; gush glad sigh',
      'gauge a high laugh; gel like a guru; hire rural lad',
      'sigh; glad grudge; high hair; huge guide failed gulag',
      'lad like a huge high gear; rage gulag; drag sigh laugh',
      'guide girl; glad ruse; high sigh gauge; huge hair lured',
    ],
  },
  5: {
    id: 5, name: 'Top Row Complete', nameKey: 'lesson.5', passWpm: 30, passAcc: 0.95,
    // Top row adds qwertyuiop to home row asdfjkl;
    // Letters available: a d e f i j k l o p q r s t u w y (no b c g h m n v x z)
    allowedChars: 'asdfjkl;qwertyuiop ',
    texts: [
      // word drills (no b c g h m n v x z)
      'quote write quiet party poetry purity output our pretty type letter',
      'a quirky poet typed quiet pretty letters; we write our output queue',
      'output type pretty quote write party equity our quiet letter poetry',
      'quirky types spout; outer prose fits a pretty swift style',
      // real sentences (no b c g h m n v x z)
      'i write prose; we at our poetry site do adjust quality output',
      'a top priority; witty quips defy tired words; our prose is free',
      'write your story; prior editors liked typewriter output style',
      'woe to rote study; our poetry is quite superior; it takes effort',
      'spool quiet utility; wider poetry just offers a stellar style tip',
      'our quiet poet writes; typist pours words out quite swiftly',
    ],
  },
  6: {
    id: 6, name: 'Bottom Row', nameKey: 'lesson.6', passWpm: 32, passAcc: 0.95,
    // Bottom row adds zxcvbnm to L5; plus gh carried from L4; all 26 letters + ,./
    allowedChars: 'asdfjkl;qwertyuiopzxcvbnmgh,./ ',
    texts: [
      // word drills
      'maximize zone, fix the box; verify many objects',
      'jazz mob, vex calm, brick zone exactly objective',
      'maybe vivid zebra crosses bumpy lazy field.',
      'numb cave, frozen mix, black vibe, complex zinc',
      // real sentences
      'fix a complex bug, then verify the zone works fine.',
      'maximize every chance; brave, calm, exact moves win.',
      'jazz vibes can mix well; vivid neon black box glows.',
      'a quick brown fox jumps over the lazy vexing zinc.',
      'move boxes neatly, fix problems swiftly, never relax.',
      'the vivid jungle haze blended complex exotic scenery.',
    ],
  },
  7: {
    id: 7, name: 'Numbers Row', nameKey: 'lesson.7', passWpm: 34, passAcc: 0.95,
    allowedChars: 'asdfjkl;qwertyuiopzxcvbnmgh,./0123456789 ',
    texts: [
      // word drills with numbers
      'order 4 cubes, 23 spheres, 18 cones, 506 prisms',
      'flight 374 departs at 1815 from gate 27b',
      'we shipped 1024 units in q2, up 36 points from 750',
      'mix 3 parts water to 1 part acid; heat to 80 degrees',
      // real sentences
      'on july 4 1776, the founding document had 56 signers.',
      'call 555 1234 or visit room 208 by 9am on friday.',
      'the top 10 scores were 987, 943, 912, 888, and 876.',
      'a 40gb file took 12 minutes to upload on a 50mbps line.',
      'in 2024, over 5 billion devices connected to the net.',
      'buy 6 apples, 12 eggs, 3 loaves, and 2 cans of soup.',
    ],
  },
  8: {
    id: 8, name: 'Punctuation + Shift', nameKey: 'lesson.8', passWpm: 36, passAcc: 0.95,
    allowedChars:
      "asdfjkl;qwertyuiopzxcvbnmghASDFJKLQWERTYUIOPZXCVBNMGH,./0123456789:'\"!?- ",
    texts: [
      // quotes and punchy sentences with Shift
      'Quick! Pay attention: "Brevity is the soul of wit."',
      'It\'s 9:42 AM - she said, "Don\'t be late!"',
      'Dr. Webb asked: "Where are the reports? I need them!"',
      '"To be, or not to be?" - that is the question.',
      'First rule: "Never give up." Second rule: see rule one.',
      // more variety
      '"All great things are simple," said the wise old writer.',
      'Is it live? Or is it just a recording? Check it again!',
      'Wait - did you say "yes"? Or was it "no"? I need clarity!',
      'Tip: always ask "Why?" before "How?" - saves a lot of time.',
      '"Simplicity is the ultimate sophistication." - Da Vinci',
    ],
  },
  9: {
    id: 9, name: 'Free Text (Programmer)', nameKey: 'lesson.9', passWpm: 40, passAcc: 0.95,
    allowedChars:
      "asdfjkl;qwertyuiopzxcvbnmghASDFJKLQWERTYUIOPZXCVBNMGH,./0123456789:'\"!?-_=+(){}[]<>*&^%$#@ ",
    texts: [
      // code snippets
      'const sum = (a, b) => a + b; // returns sum',
      'if (user && user.isActive) { return user.name; }',
      'function map(arr, fn) { return arr.map(fn); }',
      'type Ok<T> = { ok: true; data: T }; type Err = { ok: false; err: string };',
      'git commit -m "feat: add reactive store + i18n support"',
      // prose and quotes
      'The quick brown fox jumps over the lazy dog.',
      '"The only way out is through." - Robert Frost',
      '"Programs must be written for people to read." - Abelson',
      'Stay hungry, stay foolish. Ship early, ship often.',
      'const [count, setCount] = useState<number>(0); // React hook',
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
