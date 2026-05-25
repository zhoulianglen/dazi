export function isMobileLike(): boolean {
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return narrow || coarse;
}

export function onLayoutChange(cb: () => void): () => void {
  const a = window.matchMedia('(max-width: 900px)');
  const b = window.matchMedia('(pointer: coarse)');
  const handler = () => cb();
  a.addEventListener('change', handler);
  b.addEventListener('change', handler);
  return () => {
    a.removeEventListener('change', handler);
    b.removeEventListener('change', handler);
  };
}
