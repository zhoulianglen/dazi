import { describe, it, expect } from 'vitest';
import { fingerOf, colorOf } from '../src/engine/finger-map';

describe('finger-map', () => {
  it('maps home-row keys to correct fingers', () => {
    expect(fingerOf('a')).toBe('L-pinky');
    expect(fingerOf('s')).toBe('L-ring');
    expect(fingerOf('d')).toBe('L-mid');
    expect(fingerOf('f')).toBe('L-index');
    expect(fingerOf('j')).toBe('R-index');
    expect(fingerOf('k')).toBe('R-mid');
    expect(fingerOf('l')).toBe('R-ring');
    expect(fingerOf(';')).toBe('R-pinky');
  });

  it('maps top-row reaches to index fingers', () => {
    expect(fingerOf('r')).toBe('L-index');
    expect(fingerOf('t')).toBe('L-index');
    expect(fingerOf('y')).toBe('R-index');
    expect(fingerOf('u')).toBe('R-index');
  });

  it('maps bottom-row keys correctly', () => {
    expect(fingerOf('z')).toBe('L-pinky');
    expect(fingerOf('x')).toBe('L-ring');
    expect(fingerOf('c')).toBe('L-mid');
    expect(fingerOf('v')).toBe('L-index');
    expect(fingerOf('m')).toBe('R-index');
    expect(fingerOf(',')).toBe('R-mid');
    expect(fingerOf('.')).toBe('R-ring');
    expect(fingerOf('/')).toBe('R-pinky');
  });

  it('maps space to thumb (defaults to left thumb)', () => {
    expect(fingerOf(' ')).toBe('L-thumb');
  });

  it('treats uppercase the same as lowercase', () => {
    expect(fingerOf('A')).toBe('L-pinky');
    expect(fingerOf('P')).toBe('R-pinky');
  });

  it('returns null for unmapped keys', () => {
    expect(fingerOf('§')).toBeNull();
    expect(fingerOf('\t')).toBeNull();
  });

  it('exposes a CSS-var color token per finger', () => {
    expect(colorOf('L-pinky')).toBe('var(--finger-L-pinky)');
    expect(colorOf('R-index')).toBe('var(--finger-R-index)');
  });
});
