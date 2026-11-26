# Desktop Typing Tutor Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a complete PC typing tutor with independent UI/content languages and correct-finger learning.

**Architecture:** Add a self-contained tutor module with pure learning logic, validated local persistence and a DOM UI. Replace the app entry point and active styles, preserving unrelated legacy modules and their existing tests.

**Tech Stack:** TypeScript, Vite, Vitest, CSS, SVG hand illustrations, localStorage.

### Task 1: Learning model and persistence

Files: src/tutor/model.ts, src/tutor/content.ts, tests/tutor.test.ts.
Write behavior tests first, run npm test -- tests/tutor.test.ts to observe missing features. Implement language-independent settings, exercise engine, validated storage, adaptive word selection, progress calculations and metrics. Run full tests and build.

### Task 2: Complete desktop UI

Files: src/main.ts, src/tutor/app.ts, src/tutor/styles.css, index.html.
Implement practice, course selection, statistics, settings, posture guide, results, keyboard and hands. Keep text input focused only during practice. Support composition, pause, restart, advance, sound, keyboard/hand visibility, locale switching, backups and local history. Verify using browser interaction and build.

### Task 3: Review and delivery

Files: README.md, design/plan documentation.
Run complete tests, production build, desktop visual review and keyboard/Chinese checks. Resolve observed defects. Update run instructions and product scope. Commit only task changes and provide a local preview URL plus commit identity.

## Execution ledger

- User approved complete product and implementation. Inline execution in the existing checkout on a dedicated codex branch; no additional worktree needed for a clean checkout.
- Chinese defaults to pinyin, with native IME mode selectable. Existing modules remain unused to avoid unrelated deletion.

## Completion evidence

- Task 1 complete: pure learning model, validated storage, English and Chinese curricula, per-mode progression and weak-key adaptation.
- Task 2 complete: all four views, independent language controls, composition-safe IME input, keyboard/hands/Shift guidance, results, preferences and backups.
- Task 3 review resolved: Escape event bubbling, modal background focus isolation, completed-session return navigation, true pause on blur, persistent storage-failure feedback, and curriculum character-set correctness. Regression tests reproduce these cases.
- Browser checks: typed English/pinyin and committed Chinese characters; exercise completion and statistics; automatic/manual courses; pause/resume; export/import with deduplication; 900px desktop layout without document overflow. OS-specific Chinese candidate-window behavior is covered through composition event simulation, not an exhaustive test of every system IME.
- Local preview is the delivery target for this repository task. Source is ready for static deployment using the retained build configuration; no production deployment or remote push performed.
