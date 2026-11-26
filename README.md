# DAZI · 打字

A complete PC browser typing tutor inspired by the focused learning experience of KeyKey. Learn standard ten-finger technique through progressive lessons, a live keyboard and hand guide, adaptive content, and personal statistics.

## Run

```bash
npm install
npm run dev        # local development; Vite prints the URL
npm test           # full unit and UI behavior suite
npm run build      # type check and generate dist/
npm run preview    # preview the production build
```

## Product

- **Practice:** seven levels, live speed/accuracy/active time, next-key and opposite-hand Shift guidance, finger illustrations, optional sound, pause/resume, restart and results.
- **Courses:** automatic progression (at least 95% accuracy plus the course speed target), or manual access to every lesson. English introduces key groups; Chinese introduces words and increasingly complex sentences.
- **Independent languages:** Chinese/English interface and Chinese/English practice content are separate preferences. Switching the interface preserves the active exercise and typed progress.
- **Two Chinese modes:** pinyin key practice (no tones; `v` for `ü`) and native IME transcription. Composition is ignored until committed; Chinese punctuation must match the displayed text.
- **Adaptive practice:** recent mistakes prioritize matching words or sentences in the next exercise, for English, pinyin and Chinese IME. Content stays inside taught keys for introductory English lessons.
- **Statistics:** speed chart, average accuracy, focused time, weak keys and dated history. English/pinyin use WPM (5 keystrokes per word); Chinese IME uses characters/minute. Modes are tracked separately.
- **Preferences:** keyboard/hands/sounds, lesson length, daily practice goal, language controls, JSON backup export/import with validation and history deduplication. Clearing history requires an explicit in-app confirmation.
- **Local data:** settings and up to 2,000 completed sessions stay in this browser under `dazi.tutor.v1`; no account or backend. Export before changing browsers. Blocked/full storage is reported without interrupting practice.

Practice pauses when the window loses focus, the page is hidden, or another view opens. Paste is disabled during exercises. The guide explains posture; the browser does not observe a learner’s actual fingers or body position. Desktop keyboards are the primary input; narrow layouts adapt, but a physical keyboard is recommended.

## Implementation

Vite + strict TypeScript + DOM/CSS, with Vitest/jsdom tests. `src/main.ts` mounts the current product in `src/tutor/`: pure session/persistence logic in `model.ts`, learning content/key mapping in `content.ts`, views in `app.ts`, visual styles in `styles.css` and Lucide SVGs in `icons.ts` (ISC license). Earlier implementation modules remain in the repository, with their regression tests, but are not bundled into the current product.

`dist/` is a static site suitable for GitHub Pages or another static host. The existing GitHub Actions base-path configuration is retained. Google Fonts are optional visual enhancements; local fallback fonts keep the product usable if they cannot load.

Design and implementation notes: `docs/plans/2026-11-26-desktop-tutor-design.md` and `docs/plans/2026-11-26-desktop-tutor.md`.
