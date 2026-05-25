import type { TypingEngine } from '../engine/typing-engine';
import { fingerOf, colorOf } from '../engine/finger-map';

const ROWS: Array<Array<{ key: string; label?: string; cls?: string }>> = [
  '`1234567890-='.split('').map(k => ({ key: k })),
  'qwertyuiop[]\\'.split('').map(k => ({ key: k })),
  'asdfghjkl;\''.split('').map(k => ({ key: k })),
  'zxcvbnm,./'.split('').map(k => ({ key: k })),
  [{ key: ' ', label: '␣', cls: 'space' }],
];

export function mountKeyboard(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('keyboard');
  host.innerHTML = ROWS.map(row => `
    <div class="row">
      ${row.map(k => {
        const f = fingerOf(k.key);
        const color = f ? colorOf(f) : 'transparent';
        const cls = ['key', k.cls ?? ''].filter(Boolean).join(' ');
        return `<div class="${cls}" data-key="${escapeAttr(k.key)}" style="--finger: ${color}">${k.label ?? escapeText(k.key)}</div>`;
      }).join('')}
    </div>
  `).join('');

  const byKey = new Map<string, HTMLElement>();
  host.querySelectorAll<HTMLElement>('.key').forEach(el => byKey.set(el.dataset.key ?? '', el));

  function updateActive(): void {
    const { cursor } = engine.getState();
    const text = engine.getText();
    const expected = text[cursor]?.toLowerCase() ?? '';
    for (const [k, el] of byKey) {
      el.dataset.active = k === expected ? '1' : '0';
    }
  }

  updateActive();
  const off = engine.subscribe((e) => {
    if (e.type === 'correct' || e.type === 'wrong') {
      const expectedKey = (e.type === 'correct' ? e.key : e.expected).toLowerCase();
      const el = byKey.get(expectedKey);
      if (el) {
        const flashCls = e.type === 'correct' ? 'flash-correct' : 'flash-wrong';
        el.classList.add(flashCls);
        setTimeout(() => el.classList.remove(flashCls), e.type === 'correct' ? 80 : 200);
      }
    }
    updateActive();
  });

  return () => { off(); host.replaceChildren(); };
}

function escapeAttr(s: string): string { return s.replace(/"/g, '&quot;'); }
function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
