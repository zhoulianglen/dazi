import type { TypingEngine } from '../engine/typing-engine';
import { fingerOf, colorOf, ALL_FINGERS } from '../engine/finger-map';
import type { Finger } from '../types';

// Schematic finger rectangles. Each <rect> represents one finger blob.
const FINGERS_L: Array<{ id: Finger; x: number; y: number; w: number; h: number }> = [
  { id: 'L-pinky', x:  4, y: 40, w: 18, h: 50 },
  { id: 'L-ring',  x: 26, y: 24, w: 18, h: 66 },
  { id: 'L-mid',   x: 48, y: 14, w: 18, h: 76 },
  { id: 'L-index', x: 70, y: 22, w: 18, h: 68 },
  { id: 'L-thumb', x: 96, y: 56, w: 32, h: 22 },
];
const FINGERS_R: Array<{ id: Finger; x: number; y: number; w: number; h: number }> = [
  { id: 'R-thumb', x:  32, y: 56, w: 32, h: 22 },
  { id: 'R-index', x:  72, y: 22, w: 18, h: 68 },
  { id: 'R-mid',   x:  94, y: 14, w: 18, h: 76 },
  { id: 'R-ring',  x: 116, y: 24, w: 18, h: 66 },
  { id: 'R-pinky', x: 138, y: 40, w: 18, h: 50 },
];

function handSvg(fingers: typeof FINGERS_L, hand: 'L' | 'R'): string {
  const palm = `<rect class="palm" x="6" y="80" width="148" height="22" rx="8" />`;
  const rects = fingers.map(f => `
    <rect class="finger" data-finger="${f.id}"
          x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="8"
          style="color: ${colorOf(f.id)}" />`).join('');
  return `<svg viewBox="0 0 160 110" data-hand="${hand}" aria-label="${hand} hand">${palm}${rects}</svg>`;
}

export function mountHands(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('hands');
  host.innerHTML = handSvg(FINGERS_L, 'L') + handSvg(FINGERS_R, 'R');
  const els = new Map<Finger, SVGRectElement>();
  for (const f of ALL_FINGERS) {
    const el = host.querySelector<SVGRectElement>(`[data-finger="${f}"]`);
    if (el) els.set(f, el);
  }

  function update(): void {
    const { cursor } = engine.getState();
    const expected = engine.getText()[cursor];
    const activeFinger = expected ? fingerOf(expected) : null;
    for (const [f, el] of els) {
      el.dataset.active = f === activeFinger ? '1' : '0';
    }
  }

  update();
  const off = engine.subscribe(update);
  return () => { off(); host.replaceChildren(); };
}
