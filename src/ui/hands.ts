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

// Short Chinese label per finger (single char fits inside the finger blob)
const LABEL: Record<Finger, string> = {
  'L-pinky': '小', 'L-ring': '无', 'L-mid': '中', 'L-index': '食', 'L-thumb': '拇',
  'R-thumb': '拇', 'R-index': '食', 'R-mid': '中', 'R-ring': '无', 'R-pinky': '小',
};

function handSvg(fingers: typeof FINGERS_L, hand: 'L' | 'R'): string {
  const palm = `<rect class="palm" x="6" y="80" width="148" height="22" rx="8" />`;
  const parts = fingers.map(f => {
    const cx = f.x + f.w / 2;
    // Place label near middle-to-bottom of each finger so it's away from fingertip
    const cy = f.id.endsWith('thumb') ? f.y + f.h / 2 + 3 : f.y + f.h - 8;
    return `
      <rect class="finger" data-finger="${f.id}"
            x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="8"
            style="color: ${colorOf(f.id)}" />
      <text class="finger-label" data-finger="${f.id}"
            x="${cx}" y="${cy}" text-anchor="middle"
            style="color: ${colorOf(f.id)}">${LABEL[f.id]}</text>`;
  }).join('');
  return `<svg viewBox="0 0 160 110" data-hand="${hand}" aria-label="${hand} hand">${palm}${parts}</svg>`;
}

export function mountHands(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('hands');
  host.innerHTML = handSvg(FINGERS_L, 'L') + handSvg(FINGERS_R, 'R');
  const rects = new Map<Finger, SVGRectElement>();
  const labels = new Map<Finger, SVGTextElement>();
  for (const f of ALL_FINGERS) {
    const r = host.querySelector<SVGRectElement>(`rect[data-finger="${f}"]`);
    const t = host.querySelector<SVGTextElement>(`text[data-finger="${f}"]`);
    if (r) rects.set(f, r);
    if (t) labels.set(f, t);
  }

  function update(): void {
    const { cursor } = engine.getState();
    const expected = engine.getText()[cursor];
    const activeFinger = expected ? fingerOf(expected) : null;
    for (const [f, el] of rects) el.dataset.active = f === activeFinger ? '1' : '0';
    for (const [f, el] of labels) el.dataset.active = f === activeFinger ? '1' : '0';
  }

  update();
  const off = engine.subscribe(update);
  return () => { off(); host.replaceChildren(); };
}
