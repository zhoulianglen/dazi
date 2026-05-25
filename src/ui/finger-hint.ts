import type { TypingEngine } from '../engine/typing-engine';
import { fingerOf, colorOf } from '../engine/finger-map';
import type { Finger } from '../types';

const FINGER_LABEL: Record<Finger, string> = {
  'L-pinky': '左手小指', 'L-ring': '左手无名指', 'L-mid': '左手中指',
  'L-index': '左手食指', 'L-thumb': '左手拇指',
  'R-thumb': '右手拇指', 'R-index': '右手食指', 'R-mid': '右手中指',
  'R-ring': '右手无名指', 'R-pinky': '右手小指',
};

export function mountFingerHint(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('finger-hint');
  host.innerHTML = `
    <span class="hint-label">下一个</span>
    <span class="hint-key" data-field="key">·</span>
    <span class="hint-arrow">→</span>
    <span class="hint-finger" data-field="finger">—</span>
    <span class="hint-code" data-field="code">—</span>
  `;

  const keyEl    = host.querySelector<HTMLElement>('[data-field="key"]')!;
  const fingerEl = host.querySelector<HTMLElement>('[data-field="finger"]')!;
  const codeEl   = host.querySelector<HTMLElement>('[data-field="code"]')!;

  function setFingerDisplay(f: Finger | null, ch: string): void {
    if (ch === '' || !f) {
      keyEl.textContent = ch === '' ? '✓' : (ch === ' ' ? '␣' : ch);
      fingerEl.textContent = ch === '' ? 'complete' : '—';
      codeEl.textContent = '';
      fingerEl.style.color = ch === '' ? 'var(--accent-green)' : 'var(--text-dim)';
      return;
    }
    keyEl.textContent = ch === ' ' ? '␣' : ch;
    fingerEl.textContent = FINGER_LABEL[f];
    codeEl.textContent = f;
    const c = colorOf(f);
    fingerEl.style.color = c;
    codeEl.style.color = c;
    keyEl.style.borderColor = c;
    keyEl.style.boxShadow = `0 0 12px ${c}`;
  }

  function update(): void {
    const text = engine.getText();
    const { cursor } = engine.getState();
    const ch = text[cursor] ?? '';
    const f = ch ? fingerOf(ch) : null;
    setFingerDisplay(f, ch);
  }

  update();
  const off = engine.subscribe(update);
  return () => { off(); host.replaceChildren(); };
}
