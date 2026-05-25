import type { Finger } from '../types';

const MAP: Record<string, Finger> = {
  // L-pinky
  '`': 'L-pinky', '1': 'L-pinky', 'q': 'L-pinky', 'a': 'L-pinky', 'z': 'L-pinky',
  // L-ring
  '2': 'L-ring', 'w': 'L-ring', 's': 'L-ring', 'x': 'L-ring',
  // L-mid
  '3': 'L-mid', 'e': 'L-mid', 'd': 'L-mid', 'c': 'L-mid',
  // L-index
  '4': 'L-index', '5': 'L-index', 'r': 'L-index', 't': 'L-index',
  'f': 'L-index', 'g': 'L-index', 'v': 'L-index', 'b': 'L-index',
  // L-thumb
  ' ': 'L-thumb',
  // R-index
  '6': 'R-index', '7': 'R-index', 'y': 'R-index', 'u': 'R-index',
  'h': 'R-index', 'j': 'R-index', 'n': 'R-index', 'm': 'R-index',
  // R-mid
  '8': 'R-mid', 'i': 'R-mid', 'k': 'R-mid', ',': 'R-mid',
  // R-ring
  '9': 'R-ring', 'o': 'R-ring', 'l': 'R-ring', '.': 'R-ring',
  // R-pinky
  '0': 'R-pinky', '-': 'R-pinky', '=': 'R-pinky',
  'p': 'R-pinky', '[': 'R-pinky', ']': 'R-pinky', '\\': 'R-pinky',
  ';': 'R-pinky', "'": 'R-pinky', '/': 'R-pinky',
};

export function fingerOf(key: string): Finger | null {
  if (key.length !== 1) return null;
  const normalized = key.toLowerCase();
  return MAP[normalized] ?? null;
}

export function colorOf(finger: Finger): string {
  return `var(--finger-${finger})`;
}

export const ALL_FINGERS: Finger[] = [
  'L-pinky', 'L-ring', 'L-mid', 'L-index', 'L-thumb',
  'R-thumb', 'R-index', 'R-mid', 'R-ring', 'R-pinky',
];
