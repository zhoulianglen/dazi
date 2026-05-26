import type { TypingEngine } from '../engine/typing-engine';
import { fingerOf, colorOf } from '../engine/finger-map';
import type { Finger } from '../types';
import { t } from '../i18n/i18n';

export function mountFingerHint(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('finger-hint');
  host.innerHTML = `
    <span class="hint-label">${t('hint.next')}</span>
    <span class="hint-key" data-field="key">·</span>
    <span class="hint-arrow">→</span>
    <span class="hint-finger" data-field="finger">—</span>
    <span class="hint-code" data-field="code">—</span>
  `;

  const labelEl  = host.querySelector<HTMLElement>('.hint-label')!;
  const keyEl    = host.querySelector<HTMLElement>('[data-field="key"]')!;
  const fingerEl = host.querySelector<HTMLElement>('[data-field="finger"]')!;
  const codeEl   = host.querySelector<HTMLElement>('[data-field="code"]')!;

  function setFingerDisplay(f: Finger | null, ch: string): void {
    if (ch === '' || !f) {
      labelEl.textContent = ch === '' ? '' : t('hint.next');
      keyEl.textContent = ch === '' ? '✓' : (ch === ' ' ? '␣' : ch);
      fingerEl.textContent = ch === '' ? t('hint.complete') : '—';
      codeEl.textContent = '';
      fingerEl.style.color = ch === '' ? 'var(--accent-green)' : 'var(--text-dim)';
      return;
    }
    labelEl.textContent = t('hint.next');
    keyEl.textContent = ch === ' ' ? '␣' : ch;
    fingerEl.textContent = t('finger.' + f as string);
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
