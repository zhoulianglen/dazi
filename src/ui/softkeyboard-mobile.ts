import type { TypingEngine } from '../engine/typing-engine';

const ROWS: string[][] = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l',';'],
  ['z','x','c','v','b','n','m',',','.','/'],
];

function thumbOf(key: string): 'L' | 'R' {
  if (key === ' ') return 'L';
  for (const row of ROWS) {
    const idx = row.indexOf(key);
    if (idx >= 0) return idx < 5 ? 'L' : 'R';
  }
  return 'L';
}

export function mountSoftKeyboard(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('softkb');
  host.innerHTML = ROWS.map(row => `
    <div class="row">
      ${row.slice(0, 5).map(k => key(k)).join('')}
      <div class="divider"></div>
      ${row.slice(5).map(k => key(k)).join('')}
    </div>
  `).join('') + `
    <div class="row">
      <div class="key space" data-key=" " data-thumb="L">␣</div>
    </div>`;

  function key(k: string): string {
    return `<div class="key" data-key="${k}" data-thumb="${thumbOf(k)}">${k}</div>`;
  }

  const byKey = new Map<string, HTMLElement>();
  host.querySelectorAll<HTMLElement>('.key').forEach(el => byKey.set(el.dataset.key ?? '', el));

  function updateActive(): void {
    const expected = engine.getText()[engine.getState().cursor]?.toLowerCase() ?? '';
    for (const [k, el] of byKey) el.dataset.active = k === expected ? '1' : '0';
  }

  for (const el of byKey.values()) {
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      const k = el.dataset.key ?? '';
      engine.handleKeydown(k);
    });
  }

  updateActive();
  const off = engine.subscribe(updateActive);
  return () => { off(); host.replaceChildren(); };
}
