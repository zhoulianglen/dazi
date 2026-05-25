import type { TypingEngine } from '../engine/typing-engine';

export function mountTypingArea(host: HTMLElement, engine: TypingEngine): () => void {
  host.classList.add('typing-area');
  const chars = document.createElement('div');
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.style.width = '0%';
  host.replaceChildren(chars, progress);

  let wrongUntil = -1; // index marked wrong (cleared on next correct key)

  function render(): void {
    const text = engine.getText();
    const { cursor, length } = engine.getState();
    const spans = new Array<string>(text.length);
    for (let i = 0; i < text.length; i++) {
      let cls = 'ch';
      if (i < cursor) cls += ' typed';
      else if (i === cursor) cls += ' cursor';
      if (i === cursor && i === wrongUntil) cls += ' wrong';
      const ch = text[i] === ' ' ? ' ' : text[i];
      spans[i] = `<span class="${cls}">${escape(ch)}</span>`;
    }
    chars.innerHTML = spans.join('');
    progress.style.width = length === 0 ? '0%' : `${(cursor / length) * 100}%`;
  }

  function escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  render();
  const off = engine.subscribe((e) => {
    if (e.type === 'wrong') { wrongUntil = engine.getState().cursor; }
    if (e.type === 'correct') { wrongUntil = -1; }
    render();
  });

  return () => { off(); host.replaceChildren(); };
}
