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
