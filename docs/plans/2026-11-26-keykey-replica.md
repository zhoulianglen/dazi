# KeyKey desktop app reproduction

User correction and approval: reproduce the actual installed KeyKey app, not an independently designed DAZI interface. Reference images were captured from com.chekazuja.keykey-setapp on 2026-11-26 (practice, settings and statistics).

## Binding visual specification

- Full-window charcoal canvas (#373739), no navigation sidebar, cards, marketing heading, brand block or footer.
- Three centered metrics near the top: speed, accuracy and typo count, with large subdued circular glyphs.
- A single horizontally flowing monospaced practice line around one-third of the viewport height; blue current-character rectangle, faded completed characters and red errors.
- Large outlined ISO/ANSI keyboard below the practice line. Active curriculum letters are white, unavailable letters dim. Expected key is blue.
- Semi-transparent hands OVER the keyboard, with one finger highlighted blue. Hands must not sit below the keyboard.
- Gear top-right, help bottom-left, restart bottom-center, statistics bottom-right.
- Settings in a right-hand drawer with Automatic/Manual, Lesson 1–6 / Expert, capitals/numbers/punctuation, language, keyboard type, speed units, one/two text lines, key/hand/keyboard hints and error sound.
- Full-canvas statistics: large title, language/layout selectors, colored lesson progression ribbon with stars, speed bars above baseline and typo bars below, recent activity details. Show actual local records; no fabricated history.

## Requested additions

Independent Chinese/English interface and content-language selectors in the existing settings drawer. Chinese content supports pinyin and native-IME practice; retain local progress and backup features in secondary settings.

## Implementation sequence

1. Add validated settings and tests; align curriculum with six frequency-based levels plus Expert, add optional capitals/numbers/punctuation and lenient typo advancement.
2. Replace app.ts and styles.css with the reference layout and original vector hand/keyboard geometry; preserve functioning timers, composition handling, backups and history.
3. Update behavioral UI tests for settings drawer navigation; add single-line scroll, independent languages, error counts, keyboard layout, overlay hand positioning and result/history checks.
4. Test, build, compare screenshots in the browser, resolve observed differences, run a final review and commit task changes.

## Ledger

- Previous implementation is committed and clean at 764245b. Continue on codex/desktop-typing-tutor.
- No additional design confirmation: user explicitly approved the real app reference and instructed implementation.

## Completion record

- Replaced the independent sidebar/card interface with the captured single-canvas practice view, SVG ISO/ANSI keyboard, translucent overlay fingers, right drawer and full-canvas statistics.
- Matched the native reference at a 1100 × 652 logical viewport (half its 2200 × 1304 capture); metrics, practice baseline and keyboard use the reference proportions. Removed the accidental compact-height override at this reference size.
- Verified browser typing: a wrong key advances, turns red and increments typos; a full no-error exercise saves its result and opens statistics using Enter on its button; Chinese character entry survives an interface-language switch with language and IME mode retained.
- Independent review findings resolved with regression tests: rounded accuracy cannot unlock an imperfect lesson; imported IDs are escaped; completion Return respects focused controls; error-free conditions apply to specialty records and stars; Chinese optional number/punctuation decorations work, while native-IME capitals are disabled.
- All 89 tests passed and production build passed before final screenshot verification. Preserved local backup import/export and compatible stored settings; no external publication performed.
