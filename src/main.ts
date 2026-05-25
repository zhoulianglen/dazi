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
