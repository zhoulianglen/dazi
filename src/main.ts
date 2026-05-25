import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/fx.css';

import { TypingEngine } from './engine/typing-engine';
import { mountTypingArea } from './ui/typing-area';
import { mountKeyboard } from './ui/keyboard';
import { mountHands } from './ui/hands';
import { mountHudPanel } from './ui/hud-panel';
import { pickText } from './engine/lessons';

const app = document.getElementById('app')!;
app.innerHTML = `
  <div class="topbar panel">DAZI</div>
  <div class="main">
    <div class="typing-area panel" id="typing"></div>
    <div class="input-area panel">[keyboard goes here]</div>
    <div class="hud-panel panel">[HUD]</div>
  </div>
`;

const engine = new TypingEngine();
engine.loadText(pickText(1), 1);
mountTypingArea(document.getElementById('typing')!, engine);

const inputArea = document.querySelector<HTMLElement>('.input-area')!;
inputArea.innerHTML = '<div class="keyboard"></div><div class="hands"></div>';
mountKeyboard(inputArea.querySelector<HTMLElement>('.keyboard')!, engine);
mountHands(inputArea.querySelector<HTMLElement>('.hands')!, engine);
mountHudPanel(document.querySelector<HTMLElement>('.hud-panel')!, engine);

document.addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key.length === 1) ev.preventDefault();
  engine.handleKeydown(ev.key);
});
