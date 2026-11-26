# DAZI desktop typing tutor

Approved direction: a complete PC-first browser typing product inspired by KeyKey's focused practice canvas, on-screen keyboard, hand guidance, progressive lessons and meaningful statistics. Keep DAZI branding and implement original UI assets.

## Experience

A quiet cream-white application, ink typography, blue active states and a restrained sidebar. Practice is the default view. Courses, statistics and settings are navigable views. The practice canvas shows the current lesson, text, live metrics, correct finger and physical QWERTY keyboard. An illustrated pair of hands explains finger ownership. Guidance covers posture and home-row returns without claiming to observe actual posture.

## Learning and languages

Interface locale (zh/en) and content language (zh/en) are independent persisted preferences. Chinese offers pinyin key training with source Chinese text and native IME transcription. English progresses from home row to full prose. Automatic progression uses accuracy and speed; manual selection remains possible. Adaptive exercises favor words containing recently mistyped keys. Each exercise ends in a meaningful result and can be repeated or advanced.

## Data and resilience

Browser-local versioned persistence for settings and completed sessions; validation of imported backups, resilient reads and writes. Export/import and explicit progress reset. Correct typed prefix, errors, corrections and elapsed active time are separate. Pause on blur/view changes, composition-safe Chinese input, no global key interception outside practice. WPM for Latin/pinyin, characters/min for Chinese. History never mixes these units.

## Validation

Unit tests for progression, language independence, accuracy, corrected mistakes, composition batches, pause timing, adaptive content, and corrupted storage. Build with TypeScript + Vite; inspect desktop UI and core flows in browser when available. No backend or account needed.
