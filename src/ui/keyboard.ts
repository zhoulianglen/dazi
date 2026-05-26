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

// SVG silhouette of a left hand. Finger tips at the top of the SVG line up with
// home-row keys (a/s/d/f) when the SVG is placed at the right pixel offset.
function leftHandSvg(): string {
  return `<svg class="hand hand-left" viewBox="0 0 240 150" aria-hidden="true">
    <rect class="palm" x="10" y="80" width="200" height="60" rx="24"/>
    <rect class="finger" data-finger="L-pinky" style="color: ${colorOf('L-pinky')}" x="20"  y="22" width="22" height="64" rx="11"/>
    <rect class="finger" data-finger="L-ring"  style="color: ${colorOf('L-ring')}"  x="68"  y="10" width="22" height="78" rx="11"/>
    <rect class="finger" data-finger="L-mid"   style="color: ${colorOf('L-mid')}"   x="116" y="4"  width="22" height="86" rx="11"/>
    <rect class="finger" data-finger="L-index" style="color: ${colorOf('L-index')}" x="164" y="12" width="22" height="78" rx="11"/>
    <rect class="finger" data-finger="L-thumb" style="color: ${colorOf('L-thumb')}" x="190" y="98" width="44" height="26" rx="13"/>
  </svg>`;
}

// Right hand: mirrored layout. R-pinky on the far right, thumb on the inside.
function rightHandSvg(): string {
  return `<svg class="hand hand-right" viewBox="0 0 240 150" aria-hidden="true">
    <rect class="palm" x="30" y="80" width="200" height="60" rx="24"/>
    <rect class="finger" data-finger="R-thumb" style="color: ${colorOf('R-thumb')}" x="6"   y="98" width="44" height="26" rx="13"/>
    <rect class="finger" data-finger="R-index" style="color: ${colorOf('R-index')}" x="54"  y="12" width="22" height="78" rx="11"/>
    <rect class="finger" data-finger="R-mid"   style="color: ${colorOf('R-mid')}"   x="102" y="4"  width="22" height="86" rx="11"/>
    <rect class="finger" data-finger="R-ring"  style="color: ${colorOf('R-ring')}"  x="150" y="10" width="22" height="78" rx="11"/>
    <rect class="finger" data-finger="R-pinky" style="color: ${colorOf('R-pinky')}" x="198" y="22" width="22" height="64" rx="11"/>
  </svg>`;
}

export function mountKeyboard(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('keyboard');
  host.innerHTML = ROWS.map(row => `
    <div class="row">
      ${row.map(k => {
        const f = fingerOf(k.key);
        const color = f ? colorOf(f) : 'transparent';
        const cls = ['key', k.cls ?? ''].filter(Boolean).join(' ');
        const label = k.label ?? escapeText(k.key);
        return `<div class="${cls}" data-key="${escapeAttr(k.key)}" style="--finger: ${color}">${label}</div>`;
      }).join('')}
    </div>
  `).join('') + `<div class="hands-overlay">${leftHandSvg()}${rightHandSvg()}</div>`;

  const byKey = new Map<string, HTMLElement>();
  host.querySelectorAll<HTMLElement>('.key').forEach(el => byKey.set(el.dataset.key ?? '', el));

  const fingers = new Map<Finger, SVGRectElement>();
  host.querySelectorAll<SVGRectElement>('.hand .finger').forEach(el => {
    const f = el.dataset.finger as Finger | undefined;
    if (f) fingers.set(f, el);
  });

  function updateActive(): void {
    const { cursor } = engine.getState();
    const text = engine.getText();
    const expected = text[cursor]?.toLowerCase() ?? '';
    for (const [k, el] of byKey) {
      el.dataset.active = k === expected ? '1' : '0';
    }
    const activeFinger = expected ? fingerOf(expected) : null;
    for (const [f, el] of fingers) {
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
