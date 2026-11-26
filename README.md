# DAZI · KeyKey-style typing tutor

**Live:** https://typing.zhoulianglen.com/

A desktop browser typing product rebuilt against screenshots of the installed KeyKey macOS app: a charcoal practice canvas, three live metrics, a single practice line, outlined keyboard with translucent hand overlays, a right-side settings drawer and a full-window statistics screen.

## Run

```bash
npm install
npm run dev        # local preview URL printed by Vite
npm test           # complete unit + DOM behavior suite
npm run build      # TypeScript check and static dist/ output
npm run preview    # serve the production build
```

## Product behavior

- First visit: an optional three-step guide chooses practice content, highlights F/J home positions and teaches three correct keystrokes in the real exercise. Completed/skipped guides stay dismissed; replay from Help. Existing learners with recorded sessions are not interrupted. An idle hint explains how to start and where to find settings/help.

- Six cumulative frequency-based lessons plus Expert. The observed first lesson uses E T A O and the reference screenshot's practice sequence. Manual mode permits any lesson; Automatic mode advances after a genuinely error-free completion. Later word lists are implemented locally; the native app's private generation algorithm is not included.
- Capitals, numbers and punctuation are independent exercise options. Chinese supports number/punctuation options; pinyin also supports capitals. Capital letters are disabled for native Chinese IME practice.
- Speed in characters/minute or words/minute (five characters per word), accuracy and typo count. Wrong characters advance and remain red. Backspace can correct the visible prefix, but recorded mistakes still prevent error-free progression.
- ISO or ANSI QWERTY keyboard geometry, active curriculum keys, next-key and opposite-hand Shift guidance, transparent hand overlays, optional hints/keyboard/error sound and one/two practice lines.
- Return restarts an active exercise or continues after completion; Escape pauses/resumes or dismisses the open panel. Window blur and page hiding pause active practice. Typing in settings and other controls does not enter the exercise.
- Independent Chinese/English interface and practice-language selectors in the drawer. Changing interface language preserves typed progress. Chinese offers pinyin (no tones, `v` for `ü`) or system IME transcription. Only committed IME text is counted; composition is not a typo.
- Statistics: per-mode lesson records, speed-based stars, a colored progression ribbon, speed/typo activity bars and selectable session details. Number/capital/punctuation records require an error-free Expert completion with that option enabled. The empty chart illustration matches the reference's empty state and is not historical data.
- Settings and up to 2,000 completed sessions stay in this browser under `dazi.tutor.v1`. JSON export/import validates records and deduplicates IDs. A persistent export warning appears if saving fails. Clearing history requires in-app confirmation.

## Scope and implementation

Desktop physical keyboards are the primary input. No account or backend is needed. Progress is local to the current browser; export before switching devices. Keyboard and hand hints recommend technique and do not detect physical posture.

The active product lives in `src/tutor/`: session/persistence in `model.ts`, curriculum in `content.ts`, scalable keyboard/hand geometry in `keyboard.ts`, UI in `app.ts`, styling in `styles.css` and Lucide icons in `icons.ts`. Earlier inactive implementation modules and regression tests remain in the repository. The build has no runtime dependencies or remote font requirement. Icon license notices are shipped in `public/third-party-licenses.txt`.

`dist/` is the production output. Cloudflare Pages project `dazi` is linked to `zhoulianglen/dazi` on `main`: build command `npm run build`, output `dist`. Relative asset URLs also keep the GitHub Pages mirror functional. The canonical custom domain is `typing.zhoulianglen.com`, with a proxied CNAME to `dazi-drs.pages.dev`. Pages Functions middleware consolidates the previous DAZI hostnames onto that domain.

## Search metadata

`src/tutor/seo.ts` is the single source for Chinese/English titles, descriptions, keywords, canonical URL, Open Graph/Twitter cards and WebSite/WebApplication structured data. Vite renders these into HTML before JavaScript runs; locale changes update the localized copy without duplicating tags. Development previews use `noindex`; production is indexable. `robots.txt` and `sitemap.xml` advertise only the real canonical root. No alternate-language URLs or ratings are invented. Google does not use the keywords meta tag for ranking; see [Google's supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags).

Social artwork is an original, reproducible SVG (`public/og-image.svg`) rendered to a 1200 × 630 PNG with `rsvg-convert`. It contains no user session data. Icons and the apple-touch icon are bundled locally.

The current binding design/implementation record is `docs/plans/2026-11-26-keykey-replica.md`; it supersedes the earlier independent desktop UI direction.
