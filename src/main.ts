import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/fx.css';

import { TypingEngine } from './engine/typing-engine';
import { mountTypingArea } from './ui/typing-area';
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

document.addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key.length === 1) ev.preventDefault();
  engine.handleKeydown(ev.key);
});
