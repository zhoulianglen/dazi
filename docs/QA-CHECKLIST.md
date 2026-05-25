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
