import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/fx.css';

import { createStore } from './state/store';
import { setLocale } from './i18n/i18n';
import { TypingEngine } from './engine/typing-engine';
import { RhythmAnalyzer } from './engine/rhythm-analyzer';
import { pickText } from './engine/lessons';
import { mountTopbar } from './ui/topbar';
import { mountTypingArea } from './ui/typing-area';
import { mountKeyboard } from './ui/keyboard';
import { mountSoftKeyboard } from './ui/softkeyboard-mobile';
import { isMobileLike, onLayoutChange } from './ui/layout';
import { mountHudPanel } from './ui/hud-panel';
import { mountFingerHint } from './ui/finger-hint';
import { openSummary } from './ui/summary-modal';
import { mountSettingsWatcher } from './ui/settings-modal';
import { mountAudio } from './audio/click';
import type { LessonId } from './types';

const app = document.getElementById('app')!;
app.innerHTML = `
  <div class="topbar panel"></div>
  <div class="main">
    <div class="typing-area panel"></div>
    <div class="hud-panel panel"></div>
    <div class="finger-hint"></div>
    <div class="input-area panel"></div>
  </div>
`;

const store = createStore();
setLocale(store.get().settings.locale);
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
    document.body.classList.remove('vignette-wrong');
    void document.body.offsetWidth;
    document.body.classList.add('vignette-wrong');
    setTimeout(() => document.body.classList.remove('vignette-wrong'), 200);
  }
});

function loadLesson(id: LessonId): void {
  if (id > store.get().progress.unlockedLesson) return;
  store.setLesson(id);
  prevKey = '';
  analyzer.reset();
  engine.loadText(pickText(id), id);
  hud.reset();
  store.setView('practicing');
}

mountTopbar(app.querySelector('.topbar')!, store, () => loadLesson(store.get().currentLesson));
mountTypingArea(app.querySelector('.typing-area')!, engine);
let inputTeardown: Array<() => void> = [];
function renderInputArea(): void {
  inputTeardown.forEach(fn => fn());
  inputTeardown = [];
  const inputArea = app.querySelector<HTMLElement>('.input-area')!;
  if (isMobileLike()) {
    inputArea.innerHTML = '<div class="softkb"></div>';
    inputTeardown.push(mountSoftKeyboard(inputArea.querySelector<HTMLElement>('.softkb')!, engine));
  } else {
    inputArea.innerHTML = '<div class="keyboard"></div>';
    inputTeardown.push(mountKeyboard(inputArea.querySelector<HTMLElement>('.keyboard')!, engine));
  }
}
renderInputArea();
onLayoutChange(renderInputArea);
const hud = mountHudPanel(app.querySelector('.hud-panel')!, engine);
mountFingerHint(app.querySelector('.finger-hint')!, engine);
mountSettingsWatcher(store);
mountAudio(store, engine);

// Apply reduced motion preference on boot
if (store.get().settings.reducedMotion) {
  document.documentElement.classList.add('reduced-motion');
}

loadLesson(1);

document.addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key.length === 1) ev.preventDefault();
  engine.handleKeydown(ev.key);
});
