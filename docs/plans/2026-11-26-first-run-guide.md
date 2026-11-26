# First-run guidance

User request: new users cannot tell how to begin. Add onboarding while preserving the KeyKey-based practice canvas.

## Implemented flow

1. Optional welcome explains ten-finger typing, local progress and independent interface/content languages. Choose English, Chinese pinyin or Chinese IME.
2. Show A S D F / J K L ; home positions. Highlight actual F/J keys and both index fingers on the existing keyboard. In short windows the live keyboard replaces the redundant miniature key row.
3. Type in the real exercise. After three genuinely correct strokes, remove the coach without replacing the active textarea, preserve the typed prefix and continue practicing. Mistakes do not count; an exercise finished with fewer than three correct strokes offers retry.

Skip is always available. Persist pending/complete/skipped in the existing backup data. Migrate older records with history to complete so existing learners are not interrupted. Help offers replay; replay preserves current progress and temporarily restores keyboard/hand hints without overwriting disabled preferences. An idle message explains where to type, how blue hints work and where language/help controls are located.

## Verification

Behavior tests cover first visit, content/locale independence, home key guidance, actual typing completion, mistakes/retry, skipping/Escape, reload persistence, replay progress, older backups, temporarily hidden hints and native input preservation. Browser checks cover all steps at ordinary desktop and 1100 × 652 viewports. A real-browser blur-on-rerender issue was resolved by keeping the active textarea mounted when the inline guide completes, plus ignoring stale detached-input blur events.
