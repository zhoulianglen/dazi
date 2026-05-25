# DAZI Typing Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, Sci-Fi HUD typing trainer with 10-finger gesture coaching for PC and dual-thumb mode for mobile, deployable as a static site to GitHub Pages.

**Architecture:** Vite + vanilla TypeScript + hand-rolled CSS. Pure-logic engine (typing-engine, rhythm-analyzer) decoupled from UI; observer-pattern store; UI modules subscribe to state slices and mutate DOM directly (no diff). localStorage for all persistence; no backend.

**Tech Stack:** Vite 5, TypeScript 5, Vitest (unit tests), CSS Grid + Custom Properties (no UI framework), Web Audio API (synthesized click sounds), GitHub Actions for deploy.

**Spec reference:** `docs/superpowers/specs/2026-05-25-dazi-typing-trainer-design.md`

**File map:**
```
.github/workflows/deploy.yml
index.html
package.json
tsconfig.json
vite.config.ts
vitest.config.ts
src/
  main.ts
  types.ts                        # shared types (Progress, SessionStats, Settings, ...)
  state/
    store.ts                      # reactive store (observer pattern)
    persistence.ts                # localStorage I/O + schema versioning
  engine/
    finger-map.ts                 # key → finger zone + color token
    lessons.ts                    # 9-level curriculum content + unlock rules
    typing-engine.ts              # input stream → state changes (no DOM)
    rhythm-analyzer.ts            # interval thresholds + slow-pair detection
  ui/
    typing-area.ts
    keyboard.ts                   # PC virtual keyboard
    hands.ts                      # PC dual-hand finger diagram
    softkeyboard-mobile.ts        # mobile dual-thumb keyboard
    hud-panel.ts                  # WPM / ACC / errors / timer
    topbar.ts
    lesson-picker.ts              # modal
    summary-modal.ts
    settings-modal.ts
    layout.ts                     # PC ↔ mobile selector
  audio/
    click.ts                      # synthesized keypress audio
  styles/
    tokens.css
    layout.css
    components.css
    fx.css
tests/
  finger-map.test.ts
  lessons.test.ts
  persistence.test.ts
  typing-engine.test.ts
  rhythm-analyzer.test.ts
  store.test.ts
  integration.test.ts
docs/
  README.md
```

---

## Task 1: Project Scaffold

Initialize a Vite + TypeScript project with strict mode and a Vitest harness. No app code yet — just the build infrastructure.

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.ts`, `src/types.ts`, `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "dazi",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0",
    "jsdom": "^25.0.0",
    "@vitest/coverage-v8": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DAZI · Typing Trainer</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/main.ts` (placeholder)**

```ts
const app = document.getElementById('app');
if (app) app.textContent = 'DAZI booting…';
```

- [ ] **Step 7: Create `src/types.ts` (shared types)**

```ts
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
```

- [ ] **Step 8: Create `.gitignore`**

```
node_modules/
dist/
*.log
.DS_Store
coverage/
```

- [ ] **Step 9: Install dependencies and verify build/tests run**

```bash
npm install
npm run build
npm run test
```

Expected build: `vite build` succeeds, produces `dist/`.
Expected test: `0 tests passing` (no tests yet, but harness works).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite + ts + vitest project"
```

---

## Task 2: Design Tokens & Base CSS

Set up the global design system (colors, fonts, animation timing) and base layout grid. Required before any UI work so styling is consistent.

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/layout.css`, `src/styles/components.css`, `src/styles/fx.css`
- Modify: `index.html` (import fonts), `src/main.ts` (import CSS)

- [ ] **Step 1: Create `src/styles/tokens.css`**

```css
:root {
  /* palette */
  --bg-deep: #05080d;
  --bg-panel: #0a1018;
  --bg-overlay: rgba(10, 16, 24, 0.85);
  --line-cyan: #5af2ff;
  --line-cyan-dim: rgba(90, 242, 255, 0.35);
  --accent-magenta: #ff3a8c;
  --accent-green: #5cff9d;
  --text-primary: #e6f6ff;
  --text-dim: rgba(230, 246, 255, 0.55);
  --text-faint: rgba(230, 246, 255, 0.25);

  /* finger zones (10 colors) */
  --finger-L-pinky:  #ff9d5c;
  --finger-L-ring:   #ffd25c;
  --finger-L-mid:    #a3ff5c;
  --finger-L-index:  #5cffd1;
  --finger-L-thumb:  #5cb0ff;
  --finger-R-thumb:  #8a5cff;
  --finger-R-index:  #d15cff;
  --finger-R-mid:    #ff5cd1;
  --finger-R-ring:   #ff5c8a;
  --finger-R-pinky:  #ff5c5c;

  /* shadow / glow */
  --glow-cyan: 0 0 12px rgba(90, 242, 255, 0.55);
  --glow-magenta: 0 0 12px rgba(255, 58, 140, 0.55);
  --glow-green: 0 0 12px rgba(92, 255, 157, 0.55);

  /* timing */
  --fast: 80ms;
  --med: 200ms;
  --slow: 400ms;
  --pulse: 1200ms;

  /* spacing */
  --gap-xs: 4px;
  --gap-sm: 8px;
  --gap-md: 16px;
  --gap-lg: 24px;
  --gap-xl: 40px;

  /* fonts */
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Menlo', monospace;
  --font-display: 'Orbitron', var(--font-mono);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --fast: 0ms;
    --med: 0ms;
    --slow: 0ms;
    --pulse: 0ms;
  }
}
```

- [ ] **Step 2: Create `src/styles/layout.css`**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  background: var(--bg-deep);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 16px;
  line-height: 1.4;
  overflow: hidden;
}

#app {
  height: 100vh;
  display: grid;
  grid-template-rows: 64px 1fr;
  grid-template-areas:
    "topbar"
    "main";
}

.topbar { grid-area: topbar; }
.main {
  grid-area: main;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 2fr 1fr;
  grid-template-areas:
    "typing typing"
    "input  hud";
  gap: var(--gap-md);
  padding: var(--gap-md);
  min-height: 0;
}

.typing-area { grid-area: typing; }
.input-area  { grid-area: input; min-height: 0; }
.hud-panel   { grid-area: hud; }

@media (max-width: 900px), (pointer: coarse) {
  #app { grid-template-rows: 56px 1fr; }
  .main {
    grid-template-columns: 1fr;
    grid-template-areas:
      "typing"
      "input"
      "hud";
    overflow-y: auto;
  }
}
```

- [ ] **Step 3: Create `src/styles/components.css`**

```css
.panel {
  background: var(--bg-panel);
  border: 1px solid var(--line-cyan-dim);
  border-radius: 4px;
  box-shadow: var(--glow-cyan);
  padding: var(--gap-md);
}

.btn {
  background: transparent;
  border: 1px solid var(--line-cyan);
  color: var(--text-primary);
  font-family: var(--font-mono);
  padding: var(--gap-sm) var(--gap-md);
  cursor: pointer;
  transition: background var(--fast), box-shadow var(--fast);
}
.btn:hover { background: rgba(90, 242, 255, 0.1); box-shadow: var(--glow-cyan); }
.btn:active { transform: translateY(1px); }

.modal-backdrop {
  position: fixed; inset: 0;
  background: var(--bg-overlay);
  display: flex; align-items: center; justify-content: center;
  z-index: 10;
}
.modal { max-width: 640px; width: 92%; }

.tag {
  display: inline-block;
  padding: 2px 8px;
  border: 1px solid var(--line-cyan-dim);
  color: var(--text-dim);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
```

- [ ] **Step 4: Create `src/styles/fx.css`**

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 4px var(--line-cyan-dim); }
  50%      { box-shadow: 0 0 16px var(--line-cyan); }
}

@keyframes flash-correct {
  0%   { background: rgba(90, 242, 255, 0.6); }
  100% { background: transparent; }
}

@keyframes flash-wrong {
  0%   { background: rgba(255, 58, 140, 0.6); }
  100% { background: transparent; }
}

.fx-pulse  { animation: pulse-glow var(--pulse) ease-in-out infinite; }
.fx-correct { animation: flash-correct var(--fast) ease-out; }
.fx-wrong   { animation: flash-wrong var(--med) ease-out; }

.vignette-wrong::after {
  content: ''; position: fixed; inset: 0; pointer-events: none;
  box-shadow: inset 0 0 80px rgba(255, 58, 140, 0.4);
  animation: flash-wrong var(--med) ease-out;
}

.scanline::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(
    180deg,
    transparent 0,
    transparent 3px,
    rgba(90, 242, 255, 0.03) 3px,
    rgba(90, 242, 255, 0.03) 4px
  );
}
```

- [ ] **Step 5: Add Google Fonts to `index.html`**

Replace the entire `<head>` content:

```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DAZI · Typing Trainer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@500;700&display=swap" rel="stylesheet">
  </head>
```

- [ ] **Step 6: Import styles from `src/main.ts`**

Replace `src/main.ts`:

```ts
import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/fx.css';

const app = document.getElementById('app');
if (app) app.innerHTML = '<div class="topbar panel">DAZI</div><div class="main"></div>';
```

- [ ] **Step 7: Verify by running dev server**

```bash
npm run dev
```

Expected: visit `http://localhost:5173` — should show a dark page with a glowing cyan-bordered "DAZI" topbar. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(styles): design tokens, layout grid, fx animations"
```

---

## Task 3: Finger Map (Pure Data)

Define which finger each key belongs to and expose the color token. Pure module, no dependencies, fully tested.

**Files:**
- Create: `src/engine/finger-map.ts`
- Test: `tests/finger-map.test.ts`

- [ ] **Step 1: Write the failing test `tests/finger-map.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { fingerOf, colorOf } from '../src/engine/finger-map';

describe('finger-map', () => {
  it('maps home-row keys to correct fingers', () => {
    expect(fingerOf('a')).toBe('L-pinky');
    expect(fingerOf('s')).toBe('L-ring');
    expect(fingerOf('d')).toBe('L-mid');
    expect(fingerOf('f')).toBe('L-index');
    expect(fingerOf('j')).toBe('R-index');
    expect(fingerOf('k')).toBe('R-mid');
    expect(fingerOf('l')).toBe('R-ring');
    expect(fingerOf(';')).toBe('R-pinky');
  });

  it('maps top-row reaches to index fingers', () => {
    expect(fingerOf('r')).toBe('L-index');
    expect(fingerOf('t')).toBe('L-index');
    expect(fingerOf('y')).toBe('R-index');
    expect(fingerOf('u')).toBe('R-index');
  });

  it('maps bottom-row keys correctly', () => {
    expect(fingerOf('z')).toBe('L-pinky');
    expect(fingerOf('x')).toBe('L-ring');
    expect(fingerOf('c')).toBe('L-mid');
    expect(fingerOf('v')).toBe('L-index');
    expect(fingerOf('m')).toBe('R-index');
    expect(fingerOf(',')).toBe('R-mid');
    expect(fingerOf('.')).toBe('R-ring');
    expect(fingerOf('/')).toBe('R-pinky');
  });

  it('maps space to thumb (defaults to left thumb)', () => {
    expect(fingerOf(' ')).toBe('L-thumb');
  });

  it('treats uppercase the same as lowercase', () => {
    expect(fingerOf('A')).toBe('L-pinky');
    expect(fingerOf('P')).toBe('R-pinky');
  });

  it('returns null for unmapped keys', () => {
    expect(fingerOf('§')).toBeNull();
    expect(fingerOf('\t')).toBeNull();
  });

  it('exposes a CSS-var color token per finger', () => {
    expect(colorOf('L-pinky')).toBe('var(--finger-L-pinky)');
    expect(colorOf('R-index')).toBe('var(--finger-R-index)');
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run tests/finger-map.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Create `src/engine/finger-map.ts`**

```ts
import type { Finger } from '../types';

const MAP: Record<string, Finger> = {
  // L-pinky
  '`': 'L-pinky', '1': 'L-pinky', 'q': 'L-pinky', 'a': 'L-pinky', 'z': 'L-pinky',
  // L-ring
  '2': 'L-ring', 'w': 'L-ring', 's': 'L-ring', 'x': 'L-ring',
  // L-mid
  '3': 'L-mid', 'e': 'L-mid', 'd': 'L-mid', 'c': 'L-mid',
  // L-index
  '4': 'L-index', '5': 'L-index', 'r': 'L-index', 't': 'L-index',
  'f': 'L-index', 'g': 'L-index', 'v': 'L-index', 'b': 'L-index',
  // L-thumb
  ' ': 'L-thumb',
  // R-index
  '6': 'R-index', '7': 'R-index', 'y': 'R-index', 'u': 'R-index',
  'h': 'R-index', 'j': 'R-index', 'n': 'R-index', 'm': 'R-index',
  // R-mid
  '8': 'R-mid', 'i': 'R-mid', 'k': 'R-mid', ',': 'R-mid',
  // R-ring
  '9': 'R-ring', 'o': 'R-ring', 'l': 'R-ring', '.': 'R-ring',
  // R-pinky
  '0': 'R-pinky', '-': 'R-pinky', '=': 'R-pinky',
  'p': 'R-pinky', '[': 'R-pinky', ']': 'R-pinky', '\\': 'R-pinky',
  ';': 'R-pinky', "'": 'R-pinky', '/': 'R-pinky',
};

export function fingerOf(key: string): Finger | null {
  if (key.length !== 1) return null;
  const normalized = key.toLowerCase();
  return MAP[normalized] ?? null;
}

export function colorOf(finger: Finger): string {
  return `var(--finger-${finger})`;
}

export const ALL_FINGERS: Finger[] = [
  'L-pinky', 'L-ring', 'L-mid', 'L-index', 'L-thumb',
  'R-thumb', 'R-index', 'R-mid', 'R-ring', 'R-pinky',
];
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/finger-map.test.ts
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(engine): finger-to-key mapping"
```

---

## Task 4: Lessons Data Module

Define the 9 lesson levels, each with name, allowed character set, text pool, and pass threshold. Provide `getLesson()` and `nextUnlocked()`.

**Files:**
- Create: `src/engine/lessons.ts`
- Test: `tests/lessons.test.ts`

- [ ] **Step 1: Write the failing test `tests/lessons.test.ts`**

```ts
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
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run tests/lessons.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create `src/engine/lessons.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/lessons.test.ts
```

Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(engine): 9-level lesson curriculum"
```

---

## Task 5: Persistence Layer

`localStorage` wrapper with schema versioning, graceful fallback when storage is unavailable, and import/export helpers.

**Files:**
- Create: `src/state/persistence.ts`
- Test: `tests/persistence.test.ts`

- [ ] **Step 1: Write the failing test `tests/persistence.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadProgress, saveProgress,
  loadSettings, saveSettings,
  loadStats, appendStat,
  exportAll, importAll,
  PROGRESS_KEY, SETTINGS_KEY, STATS_KEY,
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
      settings: { audioEnabled: true, audioVolume: 0.5, reducedMotion: false },
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
    saveSettings({ audioEnabled: false, audioVolume: 0.5, reducedMotion: false });
    expect(localStorage.getItem(SETTINGS_KEY)).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run tests/persistence.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create `src/state/persistence.ts`**

```ts
import type { Progress, Settings, SessionStats, LessonId } from '../types';

export const SCHEMA = 'dazi.v1';
export const PROGRESS_KEY = 'dazi.progress.v1';
export const SETTINGS_KEY = 'dazi.settings.v1';
export const STATS_KEY    = 'dazi.stats.v1';
const STATS_CAP = 200;

const DEFAULT_PROGRESS: Progress = { unlockedLesson: 1, perLessonBest: {} };
const DEFAULT_SETTINGS: Settings = { audioEnabled: false, audioVolume: 0.5, reducedMotion: false };

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
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/persistence.test.ts
```

Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(state): persistence with schema versioning and import/export"
```

---

## Task 6: Typing Engine (Core Logic)

Pure-logic input handler. Consumes keystrokes, advances cursor on correct, blocks on wrong, computes WPM/ACC, emits events.

**Files:**
- Create: `src/engine/typing-engine.ts`
- Test: `tests/typing-engine.test.ts`

- [ ] **Step 1: Write the failing test `tests/typing-engine.test.ts`**

```ts
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
    engine.handleKeydown('x');  // wrong
    engine.handleKeydown('y');  // wrong
    engine.handleKeydown('a');  // correct
    engine.handleKeydown('b');  // correct
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
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run tests/typing-engine.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create `src/engine/typing-engine.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/typing-engine.test.ts
```

Expected: 10 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(engine): TypingEngine with WPM/ACC + event stream"
```

---

## Task 7: Rhythm Analyzer

Subscribes to engine `correct` events, computes per-(prev, curr) interval averages, flags slow pairs at the end of a session. Pure compute — no DOM, no time source of its own.

**Files:**
- Create: `src/engine/rhythm-analyzer.ts`
- Test: `tests/rhythm-analyzer.test.ts`

- [ ] **Step 1: Write the failing test `tests/rhythm-analyzer.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { RhythmAnalyzer, thresholdFor } from '../src/engine/rhythm-analyzer';

describe('thresholdFor', () => {
  it('same finger same hand → 300ms', () => {
    expect(thresholdFor('a', 'q')).toBe(300); // both L-pinky
  });
  it('different hand → 180ms', () => {
    expect(thresholdFor('a', 'j')).toBe(180); // L-pinky → R-index
  });
  it('same hand different finger → 220ms', () => {
    expect(thresholdFor('a', 's')).toBe(220); // L-pinky → L-ring
  });
  it('index stretch (T or B) adds 40ms', () => {
    expect(thresholdFor('f', 't')).toBe(220 + 40); // L-index → L-index but T is stretch
    expect(thresholdFor('f', 'b')).toBe(220 + 40);
  });
  it('unknown pair falls back to 250ms', () => {
    expect(thresholdFor('§', 'a')).toBe(250);
  });
});

describe('RhythmAnalyzer', () => {
  it('returns empty slowPairs when no samples', () => {
    const a = new RhythmAnalyzer();
    expect(a.report()).toEqual([]);
  });

  it('flags pairs with mean above threshold (≥3 samples needed)', () => {
    const a = new RhythmAnalyzer();
    // L-pinky → R-pinky = different hand → 180ms threshold
    for (let i = 0; i < 4; i++) a.observe('a', 'p', 400);
    const report = a.report();
    expect(report.length).toBe(1);
    expect(report[0]).toMatchObject({ from: 'a', to: 'p', meanMs: 400, thresholdMs: 180 });
  });

  it('does not flag pairs with fewer than 3 samples', () => {
    const a = new RhythmAnalyzer();
    a.observe('a', 'p', 999);
    a.observe('a', 'p', 999);
    expect(a.report()).toEqual([]);
  });

  it('does not flag pairs at or under threshold', () => {
    const a = new RhythmAnalyzer();
    for (let i = 0; i < 5; i++) a.observe('a', 'j', 150);
    expect(a.report()).toEqual([]);
  });

  it('ignores the very first keystroke (interval 0)', () => {
    const a = new RhythmAnalyzer();
    a.observe('', 'a', 0);
    expect(a.report()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run tests/rhythm-analyzer.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create `src/engine/rhythm-analyzer.ts`**

```ts
import { fingerOf } from './finger-map';
import type { SessionStats } from '../types';

const STRETCH_KEYS = new Set(['t', 'b', 'y', 'n', 'g', 'h']);

export function thresholdFor(prev: string, curr: string): number {
  const fPrev = fingerOf(prev);
  const fCurr = fingerOf(curr);
  if (!fPrev || !fCurr) return 250;

  const sameHand = fPrev[0] === fCurr[0]; // 'L' or 'R' prefix
  const sameFinger = fPrev === fCurr;

  let base: number;
  if (!sameHand) base = 180;
  else if (sameFinger) base = 300;
  else base = 220;

  const stretchBonus = STRETCH_KEYS.has(curr.toLowerCase()) ? 40 : 0;
  return base + stretchBonus;
}

type Sample = { sumMs: number; count: number };

export class RhythmAnalyzer {
  private samples = new Map<string, Sample>(); // key = `${from}|${to}`

  observe(from: string, to: string, intervalMs: number): void {
    if (!from || intervalMs <= 0) return;
    const k = `${from}|${to}`;
    const s = this.samples.get(k) ?? { sumMs: 0, count: 0 };
    s.sumMs += intervalMs;
    s.count++;
    this.samples.set(k, s);
  }

  report(): SessionStats['slowPairs'] {
    const out: SessionStats['slowPairs'] = [];
    for (const [k, s] of this.samples) {
      if (s.count < 3) continue;
      const [from, to] = k.split('|');
      const meanMs = s.sumMs / s.count;
      const thresholdMs = thresholdFor(from, to);
      if (meanMs > thresholdMs) {
        out.push({ from, to, meanMs: Math.round(meanMs), thresholdMs });
      }
    }
    return out.sort((a, b) => (b.meanMs - b.thresholdMs) - (a.meanMs - a.thresholdMs));
  }

  reset(): void {
    this.samples.clear();
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/rhythm-analyzer.test.ts
```

Expected: 10 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(engine): rhythm analyzer for slow-pair detection"
```

---

## Task 8: Reactive Store

Observer-pattern store backed by persistence. Owns `view`, `currentLesson`, `progress`, `settings`. Provides `subscribe(selector, cb)` and action helpers.

**Files:**
- Create: `src/state/store.ts`
- Test: `tests/store.test.ts`

- [ ] **Step 1: Write the failing test `tests/store.test.ts`**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '../src/state/store';

describe('store', () => {
  beforeEach(() => localStorage.clear());

  it('initializes from persistence defaults', () => {
    const s = createStore();
    expect(s.get().view).toBe('idle');
    expect(s.get().currentLesson).toBe(1);
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

  it('setLesson rejects locked lessons', () => {
    const s = createStore();
    expect(s.get().progress.unlockedLesson).toBe(1);
    s.setLesson(5);
    expect(s.get().currentLesson).toBe(1);
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
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run tests/store.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create `src/state/store.ts`**

```ts
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

type Listener = (state: AppState) => void;
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
    currentLesson: 1,
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
      if (id > state.progress.unlockedLesson) return;
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
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/store.test.ts
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(state): reactive store with selector subscriptions"
```

---

## Task 9: Typing Area UI

Renders text with three regions: typed (dim), current cursor (highlighted), upcoming. Subscribes to engine `correct`/`wrong` events.

**Files:**
- Create: `src/ui/typing-area.ts`
- Modify: `src/styles/components.css` (append typing-area styles)

- [ ] **Step 1: Append CSS to `src/styles/components.css`**

```css
.typing-area {
  font-family: var(--font-mono);
  font-size: clamp(20px, 3.2vw, 32px);
  line-height: 1.6;
  letter-spacing: 0.02em;
  white-space: pre-wrap;
  padding: var(--gap-lg);
  position: relative;
  overflow-y: auto;
}
.typing-area .ch        { color: var(--text-faint); }
.typing-area .ch.typed  { color: var(--text-dim); }
.typing-area .ch.wrong  { color: var(--accent-magenta); text-decoration: underline wavy; }
.typing-area .ch.cursor {
  color: var(--line-cyan);
  background: rgba(90, 242, 255, 0.12);
  border-radius: 2px;
  box-shadow: 0 0 8px var(--line-cyan-dim);
  animation: pulse-glow var(--pulse) ease-in-out infinite;
}
.typing-area .progress {
  position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
  background: linear-gradient(90deg, var(--line-cyan), var(--accent-green));
  transition: width var(--med) ease-out;
  box-shadow: var(--glow-cyan);
}
```

- [ ] **Step 2: Create `src/ui/typing-area.ts`**

```ts
import type { TypingEngine } from '../engine/typing-engine';

export function mountTypingArea(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('typing-area');
  const chars = document.createElement('div');
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.style.width = '0%';
  host.replaceChildren(chars, progress);

  let wrongUntil = -1; // index marked wrong (cleared on next correct key)

  function render(): void {
    const text = engine.getText();
    const { cursor, length } = engine.getState();
    const spans = new Array<string>(text.length);
    for (let i = 0; i < text.length; i++) {
      let cls = 'ch';
      if (i < cursor) cls += ' typed';
      else if (i === cursor) cls += ' cursor';
      if (i === cursor && i === wrongUntil) cls += ' wrong';
      const ch = text[i] === ' ' ? ' ' : text[i];
      spans[i] = `<span class="${cls}">${escape(ch)}</span>`;
    }
    chars.innerHTML = spans.join('');
    progress.style.width = length === 0 ? '0%' : `${(cursor / length) * 100}%`;
  }

  function escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  render();
  const off = engine.subscribe((e) => {
    if (e.type === 'wrong') { wrongUntil = engine.getState().cursor; }
    if (e.type === 'correct') { wrongUntil = -1; }
    render();
  });

  return () => { off(); host.replaceChildren(); };
}
```

- [ ] **Step 3: Wire into `src/main.ts` (smoke check only — full wiring later)**

Replace `src/main.ts`:

```ts
import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/fx.css';

import { TypingEngine } from './engine/typing-engine';
import { mountTypingArea } from './ui/typing-area';
import { pickText } from './engine/lessons';

const app = document.getElementById('app')!;
app.innerHTML = `
  <div class="topbar panel">DAZI</div>
  <div class="main">
    <div class="typing-area panel" id="typing"></div>
    <div class="input-area panel">[keyboard goes here]</div>
    <div class="hud-panel panel">[HUD]</div>
  </div>
`;

const engine = new TypingEngine();
engine.loadText(pickText(1), 1);
mountTypingArea(document.getElementById('typing')!, engine);

document.addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key.length === 1) ev.preventDefault();
  engine.handleKeydown(ev.key);
});
```

- [ ] **Step 4: Smoke test in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Type the visible home-row text. Verify: cursor advances, typed chars dim, wrong chars highlight magenta. Stop server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): typing area with live cursor + wrong-char highlight"
```

---

## Task 10: Virtual Keyboard (PC)

Renders the full QWERTY keyboard with each key colored by its finger zone, and pulse-highlights the key the user should press next.

**Files:**
- Create: `src/ui/keyboard.ts`
- Modify: `src/styles/components.css`

- [ ] **Step 1: Append CSS to `src/styles/components.css`**

```css
.keyboard {
  display: grid;
  gap: var(--gap-xs);
  font-family: var(--font-mono);
  user-select: none;
}
.keyboard .row { display: flex; gap: var(--gap-xs); justify-content: center; }
.keyboard .key {
  flex: 0 0 44px;
  height: 44px;
  border: 1px solid var(--line-cyan-dim);
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  color: var(--text-primary);
  background: rgba(255,255,255,0.02);
  position: relative;
  transition: box-shadow var(--fast), background var(--fast);
}
.keyboard .key.wide { flex-basis: 88px; }
.keyboard .key.space { flex-basis: 320px; }
.keyboard .key::before {
  content: ''; position: absolute; inset: 0 0 -2px 0;
  border-bottom: 2px solid var(--finger);
  border-radius: 4px;
  opacity: 0.6;
}
.keyboard .key[data-active="1"] {
  border-color: var(--line-cyan);
  box-shadow: var(--glow-cyan);
  background: rgba(90, 242, 255, 0.08);
  animation: pulse-glow var(--pulse) ease-in-out infinite;
}
.keyboard .key.flash-correct {
  background: rgba(90, 242, 255, 0.35);
}
.keyboard .key.flash-wrong {
  background: rgba(255, 58, 140, 0.35);
  border-color: var(--accent-magenta);
}
```

- [ ] **Step 2: Create `src/ui/keyboard.ts`**

```ts
import type { TypingEngine } from '../engine/typing-engine';
import { fingerOf, colorOf } from '../engine/finger-map';

const ROWS: Array<Array<{ key: string; label?: string; cls?: string }>> = [
  '`1234567890-='.split('').map(k => ({ key: k })),
  'qwertyuiop[]\\'.split('').map(k => ({ key: k })),
  'asdfghjkl;\''.split('').map(k => ({ key: k })),
  'zxcvbnm,./'.split('').map(k => ({ key: k })),
  [{ key: ' ', label: '␣', cls: 'space' }],
];

export function mountKeyboard(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('keyboard');
  host.innerHTML = ROWS.map(row => `
    <div class="row">
      ${row.map(k => {
        const f = fingerOf(k.key);
        const color = f ? colorOf(f) : 'transparent';
        const cls = ['key', k.cls ?? ''].filter(Boolean).join(' ');
        return `<div class="${cls}" data-key="${escapeAttr(k.key)}" style="--finger: ${color}">${k.label ?? escapeText(k.key)}</div>`;
      }).join('')}
    </div>
  `).join('');

  const byKey = new Map<string, HTMLElement>();
  host.querySelectorAll<HTMLElement>('.key').forEach(el => byKey.set(el.dataset.key ?? '', el));

  function updateActive(): void {
    const { cursor } = engine.getState();
    const text = engine.getText();
    const expected = text[cursor]?.toLowerCase() ?? '';
    for (const [k, el] of byKey) {
      el.dataset.active = k === expected ? '1' : '0';
    }
  }

  updateActive();
  const off = engine.subscribe((e) => {
    if (e.type === 'correct' || e.type === 'wrong') {
      const expectedKey = (e.type === 'correct' ? e.key : e.expected).toLowerCase();
      const el = byKey.get(expectedKey);
      if (el) {
        const flashCls = e.type === 'correct' ? 'flash-correct' : 'flash-wrong';
        el.classList.add(flashCls);
        setTimeout(() => el.classList.remove(flashCls), e.type === 'correct' ? 80 : 200);
      }
    }
    updateActive();
  });

  return () => { off(); host.replaceChildren(); };
}

function escapeAttr(s: string): string { return s.replace(/"/g, '&quot;'); }
function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

- [ ] **Step 3: Wire into `src/main.ts`**

Replace the `[keyboard goes here]` placeholder area:

```ts
import { mountKeyboard } from './ui/keyboard';
// …existing imports
```

Then after `mountTypingArea(...)`:

```ts
const inputArea = document.querySelector<HTMLElement>('.input-area')!;
inputArea.innerHTML = '<div class="keyboard"></div>';
mountKeyboard(inputArea.querySelector<HTMLElement>('.keyboard')!, engine);
```

- [ ] **Step 4: Smoke test in browser**

```bash
npm run dev
```

Expected: full keyboard renders with colored finger-zone underlines. The key matching the current cursor pulses. Typing flashes correct/wrong on the right key. Stop server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): virtual keyboard with finger zones and live highlight"
```

---

## Task 11: Hands Diagram (PC)

Two SVG hands below the keyboard. Each finger lights up in its zone color; the finger expected for the next keystroke pulses brighter.

**Files:**
- Create: `src/ui/hands.ts`
- Modify: `src/styles/components.css`

- [ ] **Step 1: Append CSS**

```css
.hands {
  display: flex; justify-content: center; gap: var(--gap-xl);
  margin-top: var(--gap-md);
}
.hands svg { width: 160px; height: 110px; }
.hands .finger {
  fill: currentColor;
  opacity: 0.18;
  transition: opacity var(--fast), filter var(--fast);
}
.hands .finger[data-active="1"] {
  opacity: 1;
  filter: drop-shadow(0 0 8px currentColor);
  animation: pulse-glow var(--pulse) ease-in-out infinite;
}
.hands .palm { fill: var(--line-cyan-dim); opacity: 0.15; }
```

- [ ] **Step 2: Create `src/ui/hands.ts`**

```ts
import type { TypingEngine } from '../engine/typing-engine';
import { fingerOf, colorOf, ALL_FINGERS } from '../engine/finger-map';
import type { Finger } from '../types';

// Schematic finger rectangles. Each <rect> represents one finger blob.
// L hand (from pinky to thumb): x positions 0..4
const FINGERS_L: Array<{ id: Finger; x: number; y: number; w: number; h: number }> = [
  { id: 'L-pinky', x:  4, y: 40, w: 18, h: 50 },
  { id: 'L-ring',  x: 26, y: 24, w: 18, h: 66 },
  { id: 'L-mid',   x: 48, y: 14, w: 18, h: 76 },
  { id: 'L-index', x: 70, y: 22, w: 18, h: 68 },
  { id: 'L-thumb', x: 96, y: 56, w: 32, h: 22 },
];
const FINGERS_R: Array<{ id: Finger; x: number; y: number; w: number; h: number }> = [
  { id: 'R-thumb', x:  32, y: 56, w: 32, h: 22 },
  { id: 'R-index', x:  72, y: 22, w: 18, h: 68 },
  { id: 'R-mid',   x:  94, y: 14, w: 18, h: 76 },
  { id: 'R-ring',  x: 116, y: 24, w: 18, h: 66 },
  { id: 'R-pinky', x: 138, y: 40, w: 18, h: 50 },
];

function handSvg(fingers: typeof FINGERS_L, hand: 'L' | 'R'): string {
  const palm = `<rect class="palm" x="6" y="80" width="148" height="22" rx="8" />`;
  const rects = fingers.map(f => `
    <rect class="finger" data-finger="${f.id}"
          x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="8"
          style="color: ${colorOf(f.id)}" />`).join('');
  return `<svg viewBox="0 0 160 110" data-hand="${hand}" aria-label="${hand} hand">${palm}${rects}</svg>`;
}

export function mountHands(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('hands');
  host.innerHTML = handSvg(FINGERS_L, 'L') + handSvg(FINGERS_R, 'R');
  const els = new Map<Finger, SVGRectElement>();
  for (const f of ALL_FINGERS) {
    const el = host.querySelector<SVGRectElement>(`[data-finger="${f}"]`);
    if (el) els.set(f, el);
  }

  function update(): void {
    const { cursor } = engine.getState();
    const expected = engine.getText()[cursor];
    const activeFinger = expected ? fingerOf(expected) : null;
    for (const [f, el] of els) {
      el.dataset.active = f === activeFinger ? '1' : '0';
    }
  }

  update();
  const off = engine.subscribe(update);
  return () => { off(); host.replaceChildren(); };
}
```

- [ ] **Step 3: Wire into `src/main.ts`** (append hands element after keyboard)

In `src/main.ts`, change the `inputArea.innerHTML` line to:

```ts
inputArea.innerHTML = '<div class="keyboard"></div><div class="hands"></div>';
mountKeyboard(inputArea.querySelector<HTMLElement>('.keyboard')!, engine);
mountHands(inputArea.querySelector<HTMLElement>('.hands')!, engine);
```

Add to the imports:

```ts
import { mountHands } from './ui/hands';
```

- [ ] **Step 4: Smoke test**

```bash
npm run dev
```

Expected: two schematic hands appear below keyboard; the finger matching the next key pulses in its color. Stop server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): two-hand finger diagram with active-finger pulse"
```

---

## Task 12: HUD Panel

Right side panel: WPM, ACC, error keys, session timer. Live updates on every engine event + a 200ms timer tick for the elapsed clock.

**Files:**
- Create: `src/ui/hud-panel.ts`
- Modify: `src/styles/components.css`

- [ ] **Step 1: Append CSS**

```css
.hud-panel { display: flex; flex-direction: column; gap: var(--gap-md); }
.hud-row { display: flex; justify-content: space-between; align-items: baseline; }
.hud-row .label { color: var(--text-dim); font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; }
.hud-row .value { font-family: var(--font-display); font-size: 28px; color: var(--line-cyan); text-shadow: var(--glow-cyan); }
.hud-bar { height: 6px; background: rgba(90,242,255,0.08); border-radius: 3px; overflow: hidden; }
.hud-bar > span { display: block; height: 100%; background: var(--line-cyan); transition: width var(--med) ease-out; }
.hud-errors { font-size: 12px; color: var(--text-dim); min-height: 24px; }
.hud-errors .err { color: var(--accent-magenta); margin-right: var(--gap-sm); }
```

- [ ] **Step 2: Create `src/ui/hud-panel.ts`**

```ts
import type { TypingEngine } from '../engine/typing-engine';

export function mountHudPanel(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('hud-panel');
  host.innerHTML = `
    <div>
      <div class="hud-row"><span class="label">WPM</span><span class="value" data-field="wpm">0</span></div>
      <div class="hud-bar"><span data-field="wpm-bar" style="width:0%"></span></div>
    </div>
    <div>
      <div class="hud-row"><span class="label">Accuracy</span><span class="value" data-field="acc">100%</span></div>
      <div class="hud-bar"><span data-field="acc-bar" style="width:100%"></span></div>
    </div>
    <div>
      <div class="hud-row"><span class="label">Session</span><span class="value" data-field="time">00:00</span></div>
    </div>
    <div>
      <div class="label">Error keys</div>
      <div class="hud-errors" data-field="errors"></div>
    </div>
  `;
  const f = (name: string) => host.querySelector<HTMLElement>(`[data-field="${name}"]`)!;
  const startedAt = Date.now();
  const errorTally: Record<string, number> = {};

  function fmtTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function update(): void {
    const st = engine.getState();
    f('wpm').textContent = String(st.wpm);
    f('wpm-bar').style.width = `${Math.min(100, (st.wpm / 80) * 100)}%`;
    f('acc').textContent = `${Math.round(st.acc * 100)}%`;
    f('acc-bar').style.width = `${st.acc * 100}%`;
    const errEl = f('errors');
    const entries = Object.entries(errorTally).sort((a, b) => b[1] - a[1]).slice(0, 6);
    errEl.innerHTML = entries.length === 0
      ? '<span style="opacity:0.4">—</span>'
      : entries.map(([k, n]) => `<span class="err">${escapeText(k)}×${n}</span>`).join('');
  }

  function tick(): void {
    f('time').textContent = fmtTime(Date.now() - startedAt);
    update();
  }
  const interval = window.setInterval(tick, 200);

  const off = engine.subscribe((e) => {
    if (e.type === 'wrong') errorTally[e.expected] = (errorTally[e.expected] ?? 0) + 1;
    update();
  });

  update();
  return () => { clearInterval(interval); off(); host.replaceChildren(); };
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

- [ ] **Step 3: Wire into `src/main.ts`**

Add to imports:

```ts
import { mountHudPanel } from './ui/hud-panel';
```

Replace the `<div class="hud-panel panel">[HUD]</div>` setup; after rendering:

```ts
mountHudPanel(document.querySelector<HTMLElement>('.hud-panel')!, engine);
```

- [ ] **Step 4: Smoke test**

```bash
npm run dev
```

Expected: HUD shows live WPM bar, ACC %, session clock ticking, error keys appear in magenta after typos. Stop server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): live HUD panel with WPM/ACC/timer/errors"
```

---

## Task 13: Topbar + Lesson Picker

Topbar shows the app name + current lesson + a button to open a picker modal listing all 9 lessons with locked/unlocked state.

**Files:**
- Create: `src/ui/topbar.ts`, `src/ui/lesson-picker.ts`
- Modify: `src/styles/components.css`

- [ ] **Step 1: Append CSS**

```css
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 var(--gap-lg);
  border-bottom: 1px solid var(--line-cyan-dim);
}
.topbar .brand { font-family: var(--font-display); font-size: 20px; letter-spacing: 0.3em; color: var(--line-cyan); }
.topbar .controls { display: flex; gap: var(--gap-sm); align-items: center; }

.lesson-picker { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gap-sm); }
.lesson-card {
  border: 1px solid var(--line-cyan-dim);
  padding: var(--gap-md);
  cursor: pointer;
  transition: box-shadow var(--fast), background var(--fast);
}
.lesson-card[data-locked="1"] { opacity: 0.35; cursor: not-allowed; }
.lesson-card:not([data-locked="1"]):hover { box-shadow: var(--glow-cyan); background: rgba(90,242,255,0.06); }
.lesson-card .id { font-family: var(--font-display); color: var(--line-cyan); }
.lesson-card .name { color: var(--text-primary); margin-top: 4px; }
.lesson-card .meta { color: var(--text-dim); font-size: 12px; margin-top: 4px; }
```

- [ ] **Step 2: Create `src/ui/lesson-picker.ts`**

```ts
import type { Store } from '../state/store';
import { ALL_LESSON_IDS, getLesson } from '../engine/lessons';
import type { LessonId } from '../types';

export function openLessonPicker(store: Store, onPick: (id: LessonId) => void): void {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal panel';
  modal.innerHTML = `
    <h2 style="font-family: var(--font-display); letter-spacing: 0.2em; color: var(--line-cyan); margin-bottom: var(--gap-md)">SELECT LESSON</h2>
    <div class="lesson-picker">
      ${ALL_LESSON_IDS.map(id => {
        const l = getLesson(id);
        const unlocked = id <= store.get().progress.unlockedLesson;
        const best = store.get().progress.perLessonBest[id];
        return `
          <div class="lesson-card" data-id="${id}" data-locked="${unlocked ? 0 : 1}">
            <div class="id">L${String(id).padStart(2, '0')}</div>
            <div class="name">${l.name}</div>
            <div class="meta">pass ≥ ${l.passWpm} WPM${best ? ` · best ${best.wpm}` : ''}</div>
          </div>`;
      }).join('')}
    </div>
    <div style="text-align:right; margin-top: var(--gap-md)"><button class="btn" data-close>Cancel</button></div>
  `;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function close() { backdrop.remove(); }
  backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });
  modal.querySelector('[data-close]')!.addEventListener('click', close);
  modal.querySelectorAll<HTMLElement>('.lesson-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.dataset.locked === '1') return;
      const id = Number(card.dataset.id) as LessonId;
      onPick(id);
      close();
    });
  });
}
```

- [ ] **Step 3: Create `src/ui/topbar.ts`**

```ts
import type { Store } from '../state/store';
import { getLesson } from '../engine/lessons';
import { openLessonPicker } from './lesson-picker';

export function mountTopbar(host: HTMLElement, store: Store, onLessonChange: () => void): () => void {
  host.classList.add('topbar');
  host.innerHTML = `
    <div class="brand">DAZI</div>
    <div class="controls">
      <span class="tag" data-field="current">L01 · Home Row</span>
      <button class="btn" data-action="pick">Change Lesson</button>
      <button class="btn" data-action="settings">⚙</button>
    </div>
  `;

  function refresh(): void {
    const id = store.get().currentLesson;
    const l = getLesson(id);
    host.querySelector<HTMLElement>('[data-field="current"]')!.textContent =
      `L${String(id).padStart(2, '0')} · ${l.name}`;
  }
  refresh();

  const offLesson = store.subscribe(s => s.currentLesson, refresh);

  host.querySelector<HTMLButtonElement>('[data-action="pick"]')!.addEventListener('click', () => {
    openLessonPicker(store, (id) => { store.setLesson(id); onLessonChange(); });
  });
  host.querySelector<HTMLButtonElement>('[data-action="settings"]')!.addEventListener('click', () => {
    store.setView('settings');
  });

  return () => { offLesson(); host.replaceChildren(); };
}
```

- [ ] **Step 4: Wire into `src/main.ts`**

Replace `src/main.ts` end-to-end (this is the consolidation):

```ts
import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/fx.css';

import { createStore } from './state/store';
import { TypingEngine } from './engine/typing-engine';
import { pickText } from './engine/lessons';
import { mountTopbar } from './ui/topbar';
import { mountTypingArea } from './ui/typing-area';
import { mountKeyboard } from './ui/keyboard';
import { mountHands } from './ui/hands';
import { mountHudPanel } from './ui/hud-panel';

const app = document.getElementById('app')!;
app.innerHTML = `
  <div class="topbar panel"></div>
  <div class="main">
    <div class="typing-area panel"></div>
    <div class="input-area panel">
      <div class="keyboard"></div>
      <div class="hands"></div>
    </div>
    <div class="hud-panel panel"></div>
  </div>
`;

const store = createStore();
const engine = new TypingEngine();

function startLesson(): void {
  const id = store.get().currentLesson;
  engine.loadText(pickText(id), id);
  store.setView('practicing');
}

mountTopbar(app.querySelector('.topbar')!, store, startLesson);
mountTypingArea(app.querySelector('.typing-area')!, engine);
mountKeyboard(app.querySelector('.keyboard')!, engine);
mountHands(app.querySelector('.hands')!, engine);
mountHudPanel(app.querySelector('.hud-panel')!, engine);

startLesson();

document.addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key.length === 1) ev.preventDefault();
  engine.handleKeydown(ev.key);
});
```

- [ ] **Step 5: Smoke test**

```bash
npm run dev
```

Expected: topbar shows "DAZI" + current lesson; "Change Lesson" opens a picker modal; locked lessons are dim; clicking an unlocked lesson loads new text. Stop server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): topbar + lesson picker modal"
```

---

## Task 14: Summary Modal

When `engine` emits `finished`, gather rhythm-analyzer output, call `store.recordResult`, and show a modal with WPM/ACC, slow pairs (with their suggested fingers), and Next/Retry buttons.

**Files:**
- Create: `src/ui/summary-modal.ts`
- Modify: `src/main.ts` (wire engine → analyzer + summary), `src/styles/components.css`

- [ ] **Step 1: Append CSS**

```css
.summary { display: flex; flex-direction: column; gap: var(--gap-md); }
.summary .big { display: flex; gap: var(--gap-xl); justify-content: center; }
.summary .big > div { text-align: center; }
.summary .big .label { color: var(--text-dim); font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; }
.summary .big .value { font-family: var(--font-display); font-size: 48px; color: var(--line-cyan); text-shadow: var(--glow-cyan); }
.summary .verdict { text-align: center; font-family: var(--font-display); letter-spacing: 0.2em; }
.summary .verdict.pass { color: var(--accent-green); text-shadow: var(--glow-green); }
.summary .verdict.fail { color: var(--accent-magenta); text-shadow: var(--glow-magenta); }
.summary .slow-list { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.summary .slow-list .slow { color: var(--text-dim); }
.summary .slow-list .slow b { color: var(--accent-magenta); }
.summary .actions { display: flex; gap: var(--gap-md); justify-content: flex-end; margin-top: var(--gap-md); }
```

- [ ] **Step 2: Create `src/ui/summary-modal.ts`**

```ts
import type { SessionStats } from '../types';
import { passesLesson, getLesson } from '../engine/lessons';
import { fingerOf } from '../engine/finger-map';

const FINGER_LABEL: Record<string, string> = {
  'L-pinky': '左手小指', 'L-ring': '左手无名指', 'L-mid': '左手中指', 'L-index': '左手食指', 'L-thumb': '左手拇指',
  'R-thumb': '右手拇指', 'R-index': '右手食指', 'R-mid': '右手中指', 'R-ring': '右手无名指', 'R-pinky': '右手小指',
};

export function openSummary(
  stats: SessionStats,
  onRetry: () => void,
  onNext: () => void,
): void {
  const lesson = getLesson(stats.lessonId);
  const passed = passesLesson(stats.lessonId, stats);

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal panel summary';

  const slowItems = stats.slowPairs.slice(0, 5).map(p => {
    const f = fingerOf(p.to);
    const hint = f ? FINGER_LABEL[f] : '?';
    return `<div class="slow">  <b>${escapeText(p.from)} → ${escapeText(p.to)}</b>: ${p.meanMs}ms (上限 ${p.thresholdMs}ms) · 应使用 ${hint}</div>`;
  }).join('') || '<div class="slow" style="opacity:0.5">无慢键 · 节奏达标</div>';

  modal.innerHTML = `
    <div class="verdict ${passed ? 'pass' : 'fail'}">${passed ? '◆ LESSON COMPLETE ◆' : '— RETRY —'}</div>
    <div class="big">
      <div><div class="label">WPM</div><div class="value">${stats.wpm}</div></div>
      <div><div class="label">Accuracy</div><div class="value">${Math.round(stats.acc * 100)}%</div></div>
      <div><div class="label">Time</div><div class="value">${(stats.durationMs / 1000).toFixed(1)}s</div></div>
    </div>
    <div>
      <div class="tag">Pass threshold</div>
      <div style="font-size:13px; color:var(--text-dim); margin-top:4px">
        需要 ≥ ${lesson.passWpm} WPM · ≥ ${Math.round(lesson.passAcc * 100)}%
      </div>
    </div>
    <div>
      <div class="tag">Slow pairs (handness signal)</div>
      <div class="slow-list" style="margin-top:6px">${slowItems}</div>
    </div>
    <div class="actions">
      <button class="btn" data-action="retry">Retry</button>
      ${passed ? '<button class="btn" data-action="next">Next Lesson →</button>' : ''}
    </div>
  `;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  function close() { backdrop.remove(); }
  modal.querySelector('[data-action="retry"]')!.addEventListener('click', () => { close(); onRetry(); });
  const nextBtn = modal.querySelector('[data-action="next"]');
  if (nextBtn) nextBtn.addEventListener('click', () => { close(); onNext(); });
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

- [ ] **Step 3: Wire engine + rhythm-analyzer + summary in `src/main.ts`**

Replace `src/main.ts` (this is the next consolidation):

```ts
import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/fx.css';

import { createStore } from './state/store';
import { TypingEngine } from './engine/typing-engine';
import { RhythmAnalyzer } from './engine/rhythm-analyzer';
import { pickText } from './engine/lessons';
import { mountTopbar } from './ui/topbar';
import { mountTypingArea } from './ui/typing-area';
import { mountKeyboard } from './ui/keyboard';
import { mountHands } from './ui/hands';
import { mountHudPanel } from './ui/hud-panel';
import { openSummary } from './ui/summary-modal';
import type { LessonId } from './types';

const app = document.getElementById('app')!;
app.innerHTML = `
  <div class="topbar panel"></div>
  <div class="main">
    <div class="typing-area panel"></div>
    <div class="input-area panel">
      <div class="keyboard"></div>
      <div class="hands"></div>
    </div>
    <div class="hud-panel panel"></div>
  </div>
`;

const store = createStore();
const engine = new TypingEngine();
const analyzer = new RhythmAnalyzer();

let prevKey = '';
engine.subscribe((e) => {
  if (e.type === 'correct') {
    analyzer.observe(prevKey, e.key, e.intervalMs);
    prevKey = e.key;
  } else if (e.type === 'finished') {
    const slowPairs = analyzer.report();
    const stats = { ...e.stats, slowPairs };
    store.recordResult(stats);
    openSummary(stats,
      () => loadLesson(stats.lessonId),
      () => loadLesson(Math.min(9, stats.lessonId + 1) as LessonId),
    );
  } else if (e.type === 'wrong') {
    // optional red vignette
    document.body.classList.remove('vignette-wrong');
    void document.body.offsetWidth;
    document.body.classList.add('vignette-wrong');
  }
});

function loadLesson(id: LessonId): void {
  if (id > store.get().progress.unlockedLesson) return;
  store.setLesson(id);
  prevKey = '';
  analyzer.reset();
  engine.loadText(pickText(id), id);
  store.setView('practicing');
}

mountTopbar(app.querySelector('.topbar')!, store, () => loadLesson(store.get().currentLesson));
mountTypingArea(app.querySelector('.typing-area')!, engine);
mountKeyboard(app.querySelector('.keyboard')!, engine);
mountHands(app.querySelector('.hands')!, engine);
mountHudPanel(app.querySelector('.hud-panel')!, engine);

loadLesson(1);

document.addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key.length === 1) ev.preventDefault();
  engine.handleKeydown(ev.key);
});
```

- [ ] **Step 4: Smoke test**

```bash
npm run dev
```

Type the full lesson 1 text. Expected: summary modal pops up with WPM/ACC; passing → unlocks lesson 2; Next button loads lesson 2. Retry restarts current lesson. Stop server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): summary modal with rhythm slow-pair hints"
```

---

## Task 15: Mobile Soft Keyboard

Mobile layout: 3-row touch keyboard with each half (left/right) tinted by thumb color. Taps dispatch as if typed.

**Files:**
- Create: `src/ui/softkeyboard-mobile.ts`, `src/ui/layout.ts`
- Modify: `src/main.ts`, `src/styles/components.css`

- [ ] **Step 1: Append CSS**

```css
.softkb {
  display: flex; flex-direction: column; gap: var(--gap-xs);
  padding: var(--gap-sm);
  user-select: none;
  touch-action: manipulation;
}
.softkb .row { display: flex; gap: 3px; justify-content: center; }
.softkb .key {
  flex: 1 1 0;
  min-width: 0;
  height: 44px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-size: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--line-cyan-dim);
  border-radius: 4px;
  color: var(--text-primary);
  position: relative;
}
.softkb .key[data-thumb="L"] { border-top: 2px solid var(--finger-L-thumb); }
.softkb .key[data-thumb="R"] { border-top: 2px solid var(--finger-R-thumb); }
.softkb .key[data-active="1"] { box-shadow: var(--glow-cyan); animation: pulse-glow var(--pulse) infinite; }
.softkb .key.wide { flex: 2 1 0; }
.softkb .key.space { flex: 6 1 0; }
.softkb .row .divider { width: 2px; align-self: stretch; background: var(--line-cyan-dim); opacity: 0.4; }
```

- [ ] **Step 2: Create `src/ui/softkeyboard-mobile.ts`**

```ts
import type { TypingEngine } from '../engine/typing-engine';

const ROWS: string[][] = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l',';'],
  ['z','x','c','v','b','n','m',',','.','/'],
];

// Left thumb owns first 5 of each row + left half of space; right thumb the rest.
function thumbOf(key: string): 'L' | 'R' {
  if (key === ' ') return 'L';
  for (const row of ROWS) {
    const idx = row.indexOf(key);
    if (idx >= 0) return idx < 5 ? 'L' : 'R';
  }
  return 'L';
}

export function mountSoftKeyboard(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('softkb');
  host.innerHTML = ROWS.map(row => `
    <div class="row">
      ${row.slice(0, 5).map(k => key(k)).join('')}
      <div class="divider"></div>
      ${row.slice(5).map(k => key(k)).join('')}
    </div>
  `).join('') + `
    <div class="row">
      <div class="key space" data-key=" " data-thumb="L">␣</div>
    </div>`;

  function key(k: string): string {
    return `<div class="key" data-key="${k}" data-thumb="${thumbOf(k)}">${k}</div>`;
  }

  const byKey = new Map<string, HTMLElement>();
  host.querySelectorAll<HTMLElement>('.key').forEach(el => byKey.set(el.dataset.key ?? '', el));

  function updateActive(): void {
    const expected = engine.getText()[engine.getState().cursor]?.toLowerCase() ?? '';
    for (const [k, el] of byKey) el.dataset.active = k === expected ? '1' : '0';
  }

  // Tap → engine.handleKeydown
  for (const el of byKey.values()) {
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      const k = el.dataset.key ?? '';
      engine.handleKeydown(k);
    });
  }

  updateActive();
  const off = engine.subscribe(updateActive);
  return () => { off(); host.replaceChildren(); };
}
```

- [ ] **Step 3: Create `src/ui/layout.ts`**

```ts
export function isMobileLike(): boolean {
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return narrow || coarse;
}

export function onLayoutChange(cb: () => void): () => void {
  const a = window.matchMedia('(max-width: 900px)');
  const b = window.matchMedia('(pointer: coarse)');
  const handler = () => cb();
  a.addEventListener('change', handler);
  b.addEventListener('change', handler);
  return () => {
    a.removeEventListener('change', handler);
    b.removeEventListener('change', handler);
  };
}
```

- [ ] **Step 4: Modify `src/main.ts` to switch input UI by layout**

Find the block that mounts the keyboard + hands:

```ts
mountKeyboard(app.querySelector('.keyboard')!, engine);
mountHands(app.querySelector('.hands')!, engine);
```

Replace with:

```ts
import { isMobileLike, onLayoutChange } from './ui/layout';
import { mountSoftKeyboard } from './ui/softkeyboard-mobile';

let teardown: Array<() => void> = [];
function renderInputArea(): void {
  teardown.forEach(fn => fn()); teardown = [];
  const inputArea = app.querySelector<HTMLElement>('.input-area')!;
  if (isMobileLike()) {
    inputArea.innerHTML = '<div class="softkb"></div>';
    teardown.push(mountSoftKeyboard(inputArea.querySelector<HTMLElement>('.softkb')!, engine));
  } else {
    inputArea.innerHTML = '<div class="keyboard"></div><div class="hands"></div>';
    teardown.push(mountKeyboard(inputArea.querySelector<HTMLElement>('.keyboard')!, engine));
    teardown.push(mountHands(inputArea.querySelector<HTMLElement>('.hands')!, engine));
  }
}
renderInputArea();
onLayoutChange(renderInputArea);
```

(Make sure the new imports are added at the top; remove the old direct calls.)

- [ ] **Step 5: Smoke test mobile mode**

```bash
npm run dev -- --host
```

Open dev tools, toggle device toolbar to iPhone size. Expected: soft keyboard appears with two color zones (L/R thumb tinted); tapping keys advances cursor. Resize back to desktop → real keyboard + hands re-appear. Stop server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): mobile soft keyboard with thumb zones + responsive switch"
```

---

## Task 16: Settings Modal + Import/Export

Settings: audio toggle + volume, reduced-motion toggle, "Export JSON" download, "Import JSON" file input.

**Files:**
- Create: `src/ui/settings-modal.ts`
- Modify: `src/main.ts` (open on `view: 'settings'`), `src/styles/components.css`

- [ ] **Step 1: Append CSS**

```css
.settings { display: flex; flex-direction: column; gap: var(--gap-md); }
.settings .row { display: flex; justify-content: space-between; align-items: center; }
.settings input[type="range"] { width: 200px; accent-color: var(--line-cyan); }
.settings .file { display: none; }
.settings .danger { color: var(--accent-magenta); }
```

- [ ] **Step 2: Create `src/ui/settings-modal.ts`**

```ts
import type { Store } from '../state/store';
import { exportAll, importAll } from '../state/persistence';

export function mountSettingsWatcher(store: Store): () => void {
  return store.subscribe(s => s.view, (view) => {
    if (view === 'settings') openSettings(store);
  });
}

function openSettings(store: Store): void {
  const s = store.get().settings;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal panel settings';
  modal.innerHTML = `
    <h2 style="font-family:var(--font-display); letter-spacing:0.2em; color:var(--line-cyan)">SETTINGS</h2>
    <div class="row">
      <label>Sound on keypress</label>
      <input type="checkbox" data-field="audio" ${s.audioEnabled ? 'checked' : ''}/>
    </div>
    <div class="row">
      <label>Volume</label>
      <input type="range" min="0" max="1" step="0.05" value="${s.audioVolume}" data-field="vol"/>
    </div>
    <div class="row">
      <label>Reduced motion</label>
      <input type="checkbox" data-field="rm" ${s.reducedMotion ? 'checked' : ''}/>
    </div>
    <hr style="border-color: var(--line-cyan-dim); opacity: 0.5"/>
    <div class="row">
      <button class="btn" data-action="export">⇣ Export progress</button>
      <button class="btn" data-action="import">⇡ Import progress</button>
      <input type="file" accept="application/json" class="file"/>
    </div>
    <div class="row" style="justify-content:flex-end">
      <button class="btn" data-action="close">Close</button>
    </div>
  `;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function close() { backdrop.remove(); store.setView('practicing'); }
  modal.querySelector('[data-action="close"]')!.addEventListener('click', close);
  backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });

  modal.querySelector<HTMLInputElement>('[data-field="audio"]')!.addEventListener('change', (ev) => {
    store.updateSettings({ audioEnabled: (ev.target as HTMLInputElement).checked });
  });
  modal.querySelector<HTMLInputElement>('[data-field="vol"]')!.addEventListener('input', (ev) => {
    store.updateSettings({ audioVolume: Number((ev.target as HTMLInputElement).value) });
  });
  modal.querySelector<HTMLInputElement>('[data-field="rm"]')!.addEventListener('change', (ev) => {
    const v = (ev.target as HTMLInputElement).checked;
    store.updateSettings({ reducedMotion: v });
    document.documentElement.classList.toggle('reduced-motion', v);
  });

  modal.querySelector('[data-action="export"]')!.addEventListener('click', () => {
    const blob = JSON.stringify(exportAll(), null, 2);
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `dazi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  const file = modal.querySelector<HTMLInputElement>('.file')!;
  modal.querySelector('[data-action="import"]')!.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      importAll(JSON.parse(await f.text()));
      alert('Imported. Reload to apply.');
      location.reload();
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    }
  });
}
```

- [ ] **Step 3: Wire `mountSettingsWatcher` in `src/main.ts`**

Add to imports:

```ts
import { mountSettingsWatcher } from './ui/settings-modal';
```

After other mounts:

```ts
mountSettingsWatcher(store);

// Apply reduced motion preference on boot
if (store.get().settings.reducedMotion) {
  document.documentElement.classList.add('reduced-motion');
}
```

Also append CSS at top of `src/styles/fx.css`:

```css
html.reduced-motion *, html.reduced-motion *::before, html.reduced-motion *::after {
  animation: none !important;
  transition: none !important;
}
```

- [ ] **Step 4: Smoke test**

```bash
npm run dev
```

Click the ⚙ gear in topbar → settings modal opens. Toggle reduced-motion → animations stop. Export → JSON downloads. Re-import that JSON → page reloads with progress intact. Stop server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): settings modal with audio, motion, import/export"
```

---

## Task 17: Audio (Synthesized Click)

Web Audio: short click on every keypress, lower-frequency thud on wrong key. Respects `settings.audioEnabled` and volume.

**Files:**
- Create: `src/audio/click.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create `src/audio/click.ts`**

```ts
import type { Store } from '../state/store';
import type { TypingEngine } from '../engine/typing-engine';

let ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function blip(freq: number, durMs: number, volume: number): void {
  const ac = getCtx();
  if (ac.state === 'suspended') ac.resume();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.5), t + durMs / 1000);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + durMs / 1000);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + durMs / 1000);
}

export function mountAudio(store: Store, engine: TypingEngine): () => void {
  return engine.subscribe((e) => {
    const s = store.get().settings;
    if (!s.audioEnabled) return;
    if (e.type === 'correct') blip(1200, 30, s.audioVolume * 0.4);
    else if (e.type === 'wrong') blip(180, 80, s.audioVolume * 0.6);
  });
}
```

- [ ] **Step 2: Wire in `src/main.ts`**

Add to imports:

```ts
import { mountAudio } from './audio/click';
```

After other subscriptions:

```ts
mountAudio(store, engine);
```

- [ ] **Step 3: Smoke test**

```bash
npm run dev
```

Open settings → enable sound. Type — should hear short clicks; wrong keys give a lower thud. Stop server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(audio): synthesized keypress click and wrong-key thud"
```

---

## Task 18: Integration Smoke Test

One Vitest integration test that drives the full happy path: create store + engine + analyzer, type a lesson 1 text correctly, assert recordResult unlocked lesson 2.

**Files:**
- Create: `tests/integration.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/state/store';
import { TypingEngine } from '../src/engine/typing-engine';
import { RhythmAnalyzer } from '../src/engine/rhythm-analyzer';
import { getLesson } from '../src/engine/lessons';

describe('integration: happy-path lesson 1', () => {
  beforeEach(() => localStorage.clear());

  it('typing a long lesson-1 text correctly unlocks lesson 2', () => {
    const store = createStore();
    let now = 1000;
    const engine = new TypingEngine(() => now);
    const analyzer = new RhythmAnalyzer();
    // long text so 30wpm threshold is achievable in test
    const text = 'asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl;'; // 60 chars
    engine.loadText(text, 1);

    let prev = '';
    engine.subscribe((e) => {
      if (e.type === 'correct') { analyzer.observe(prev, e.key, e.intervalMs); prev = e.key; }
      if (e.type === 'finished') {
        store.recordResult({ ...e.stats, slowPairs: analyzer.report() });
      }
    });

    for (const c of text) {
      now += 100; // 0.1s per key → 60 chars / 6s → 120 wpm
      engine.handleKeydown(c);
    }

    expect(store.get().progress.unlockedLesson).toBe(2);
    expect(store.get().lastStats?.wpm).toBeGreaterThanOrEqual(22);
    expect(store.get().lastStats?.acc).toBe(1);
  });

  it('typing with many errors does not unlock', () => {
    const store = createStore();
    let now = 1000;
    const engine = new TypingEngine(() => now);
    engine.loadText('aaaa', 1);
    engine.subscribe((e) => {
      if (e.type === 'finished') store.recordResult({ ...e.stats, slowPairs: [] });
    });
    // wrong, wrong, then correct → acc 50%
    for (let i = 0; i < 4; i++) {
      now += 200;
      engine.handleKeydown('x'); // wrong
      now += 200;
      engine.handleKeydown('a'); // correct
    }
    expect(store.get().progress.unlockedLesson).toBe(1);
  });
});
```

- [ ] **Step 2: Run test**

```bash
npx vitest run tests/integration.test.ts
```

Expected: 2 passing.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: integration happy-path for lesson unlock"
```

---

## Task 19: GitHub Actions Deploy to Pages

Auto-deploy `main` to GitHub Pages on every push.

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create workflow**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify Vite base path**

The default branch will deploy at `https://zhoulianglen.github.io/dazi/`. Edit `vite.config.ts`:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/dazi/' : './',
  build: { target: 'es2022', sourcemap: true },
});
```

- [ ] **Step 3: Generate lockfile**

```bash
npm install
```

Confirm `package-lock.json` exists.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "ci: deploy to GitHub Pages on main push"
```

- [ ] **Step 5: Push, enable Pages, verify**

```bash
git push -u origin main
```

Then on GitHub:
- Repo → Settings → Pages → Source = "GitHub Actions"
- Trigger Actions tab → wait for build+deploy job to go green
- Visit `https://zhoulianglen.github.io/dazi/` → site loads

(If the Pages settings need manual toggling, the user does this once.)

---

## Task 20: README + Manual QA Checklist

Document the project and ship a manual QA checklist for full-product verification before release.

**Files:**
- Create: `README.md`, `docs/QA-CHECKLIST.md`

- [ ] **Step 1: Create `README.md`**

````markdown
# DAZI · Typing Trainer

Single-page typing trainer focused on **gesture correction** — guides users toward standard 10-finger touch typing on PC, and dual-thumb form on mobile.

**Live:** https://zhoulianglen.github.io/dazi/

## Stack
- Vite 5 + TypeScript (strict)
- Vanilla DOM + hand-rolled CSS (no UI framework)
- Vitest (jsdom)
- localStorage for persistence; zero backend

## Develop
```bash
npm install
npm run dev      # local server
npm run test     # vitest
npm run build    # static build to dist/
```

## Architecture

```
engine/    pure logic (no DOM): typing engine, rhythm analyzer, lesson data, finger map
state/     reactive store + localStorage I/O
ui/        DOM mounters; one module per panel; subscribe to state, mutate DOM directly
audio/     web-audio synthesized keypress sounds
styles/    design tokens + layout grid + fx animations
```

UI never imports DOM-free engine internals beyond the public types in `src/types.ts`.

## Lessons
Nine fixed levels: home row → reaches → top row → bottom row → numbers → punctuation → free text. Each requires WPM + 95% accuracy to unlock the next.

## Gesture coaching
The browser can't see your fingers. We use two signals:
1. **Visual**: every key colored by its standard finger; the expected key + finger pulse.
2. **Rhythm**: per-(prev, curr) interval thresholds. Slow pairs flagged in the session summary with a hint of the correct finger.

## Spec / plan
- `docs/superpowers/specs/2026-05-25-dazi-typing-trainer-design.md`
- `docs/superpowers/plans/2026-05-25-dazi-typing-trainer.md`
````

- [ ] **Step 2: Create `docs/QA-CHECKLIST.md`**

```markdown
# DAZI · Manual QA Checklist (pre-release)

Run through this on a desktop browser AND a mobile device (or device-emulator).

## PC happy path
- [ ] Page loads, topbar shows "DAZI" and lesson "L01 · Home Row"
- [ ] Typing area shows lesson text with cursor pulsing on first character
- [ ] Each finger zone on the keyboard shows its color underline
- [ ] One hand is rendered with the expected finger glowing in zone color
- [ ] Correct key → cyan flash + cursor advances + WPM/ACC tick
- [ ] Wrong key → magenta flash + red screen vignette + cursor stays + error key added to HUD list
- [ ] Completing the text opens summary modal with WPM/ACC/time
- [ ] Slow pairs (if any) list shows "应使用 X 手指" hints
- [ ] Passing unlocks next lesson; "Next Lesson →" loads it
- [ ] Failing offers only Retry; clicking Retry reloads same lesson text

## PC controls
- [ ] Topbar "Change Lesson" opens picker; locked lessons are dim and non-clickable
- [ ] Picker shows "best XX" once a lesson is completed
- [ ] Settings (⚙) opens modal
- [ ] Toggling sound + typing produces clicks (and a thud on wrong)
- [ ] Reduced motion turns off pulses and flashes
- [ ] Export downloads a JSON file
- [ ] Import that same JSON → page reloads with same unlocked lesson

## Mobile (≤900px or coarse pointer)
- [ ] Hands diagram is hidden; soft keyboard renders instead
- [ ] Left half keys have L-thumb color stripe, right half R-thumb stripe
- [ ] Tapping a key advances cursor (no real keyboard needed)
- [ ] HUD wraps below input area; everything is scrollable
- [ ] Resizing back to desktop restores keyboard + hands without reload

## Edge cases
- [ ] Cmd/Ctrl/Alt key combos are passed through (don't trigger typing)
- [ ] Shift+letter in lessons 8/9 works (e.g., "Q" matches when 'Q' is expected)
- [ ] localStorage disabled (Safari private mode) → app still runs, no crash
- [ ] Refresh mid-lesson → progress (unlocked level) preserved; current text resets
- [ ] Same lesson twice with worse score → keeps the best, doesn't downgrade
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: README and manual QA checklist"
```

- [ ] **Step 4: Run final full test suite**

```bash
npm run test
npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 5: Push everything**

```bash
git push
```

CI runs, deploys, and the public URL goes live.

---

## Self-Review Notes

**Spec coverage check:**
- §1 product positioning, §2 scope → Task 4 (lessons), Task 19+20 (deploy + README)
- §3 information architecture → Task 2 (layout grid)
- §4.1 visual coach → Task 10 (keyboard zones), Task 11 (hands), Task 9 (typing area)
- §4.2 rhythm threshold → Task 7 (analyzer), Task 14 (summary surface)
- §4.3 9-level curriculum → Task 4
- §4.4 text sources → Task 4 (built into lessons.ts)
- §5 persistence → Task 5 + Task 16 (export/import)
- §6 visual style → Task 2 (tokens), all UI tasks
- §6.3 audio → Task 17
- §7 module division → reflected in file map
- §8 responsive → Task 15
- §9 error handling → Task 5 (graceful storage), Task 16 (import error toast), Task 14 (cmd-key ignore in main)
- §10 testing → Tasks 3/4/5/6/7/8/18
- §11 deploy → Task 19

**Placeholder scan:** No "TBD/TODO/implement later" remaining. The `slowPairs: []` placeholder in `buildStats` is intentional — it's filled by main.ts subscriber from rhythm-analyzer report.

**Type consistency:** `LessonId`, `Progress`, `SessionStats`, `Settings`, `EngineEvent`, `View`, `Finger`, `Lesson` defined once in `src/types.ts` (Task 1) and imported everywhere. `Store` interface defined in Task 8 used by Tasks 13, 16, 17. `TypingEngine` class signature stable from Task 6 onward.
