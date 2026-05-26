import type { TypingEngine } from '../engine/typing-engine';
import { fingerOf, colorOf } from '../engine/finger-map';
import type { Finger } from '../types';

const ROWS: Array<Array<{ key: string; label?: string; cls?: string }>> = [
  '`1234567890-='.split('').map(k => ({ key: k })),
  'qwertyuiop[]\\'.split('').map(k => ({ key: k })),
  'asdfghjkl;\''.split('').map(k => ({ key: k })),
  'zxcvbnm,./'.split('').map(k => ({ key: k })),
  [{ key: ' ', label: '␣', cls: 'space' }],
];

// Keys that always carry a fingertip sitting above them (home row letters + space halves).
const HOME_KEYS = new Set(['a', 's', 'd', 'f', 'j', 'k', 'l', ';']);

function fingertipSvg(f: Finger, side?: 'left' | 'right'): string {
  const sideCls = side ? ` fingertip-${side}` : '';
  return `<svg class="fingertip${sideCls}" data-finger="${f}" viewBox="0 0 24 36" style="color: ${colorOf(f)}" aria-hidden="true">
      <path class="fg-body" d="M 6 0 L 6 26 Q 6 34 12 34 Q 18 34 18 26 L 18 0 Z"/>
      <line class="fg-knuckle" x1="7" y1="6" x2="17" y2="6"/>
      <ellipse class="fg-nail" cx="12" cy="28" rx="4.5" ry="2.5"/>
    </svg>`;
}

function fingertipsForKey(key: string): string {
  if (key === ' ') {
    // Two thumbs resting on the space bar, one each side
    return fingertipSvg('L-thumb', 'left') + fingertipSvg('R-thumb', 'right');
  }
  if (HOME_KEYS.has(key)) {
    const f = fingerOf(key);
    return f ? fingertipSvg(f) : '';
  }
  return '';
}

export function mountKeyboard(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('keyboard');
  host.innerHTML = ROWS.map(row => `
    <div class="row">
      ${row.map(k => {
        const f = fingerOf(k.key);
        const color = f ? colorOf(f) : 'transparent';
        const cls = ['key', k.cls ?? ''].filter(Boolean).join(' ');
        const tips = fingertipsForKey(k.key);
        const label = k.label ?? escapeText(k.key);
        return `<div class="${cls}" data-key="${escapeAttr(k.key)}" style="--finger: ${color}">${tips}<span class="key-label">${label}</span></div>`;
      }).join('')}
    </div>
  `).join('');

  const byKey = new Map<string, HTMLElement>();
  host.querySelectorAll<HTMLElement>('.key').forEach(el => byKey.set(el.dataset.key ?? '', el));

  const fingertips = new Map<Finger, SVGElement>();
  host.querySelectorAll<SVGElement>('.fingertip').forEach(el => {
    const f = el.dataset.finger as Finger | undefined;
    if (f) fingertips.set(f, el);
  });

  function updateActive(): void {
    const { cursor } = engine.getState();
    const text = engine.getText();
    const expected = text[cursor]?.toLowerCase() ?? '';
    for (const [k, el] of byKey) {
      el.dataset.active = k === expected ? '1' : '0';
    }
    const activeFinger = expected ? fingerOf(expected) : null;
    for (const [f, el] of fingertips) {
      el.dataset.active = f === activeFinger ? '1' : '0';
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
