import type { Store } from '../state/store';
import { getLesson } from '../engine/lessons';
import { openLessonPicker } from './lesson-picker';

export function mountTopbar(host: HTMLElement, store: Store, onLessonChange: () => void): () => void {
  host.classList.add('topbar');
  host.innerHTML = `
    <div class="brand">DAZI</div>
    <div class="controls">
      <span class="tag" data-field="current">L01 · Home Row</span>
      <button class="btn" data-action="pick">Change Lesson</button>
      <button class="btn" data-action="settings">⚙</button>
    </div>
  `;

  function refresh(): void {
    const id = store.get().currentLesson;
    const l = getLesson(id);
    host.querySelector<HTMLElement>('[data-field="current"]')!.textContent =
      `L${String(id).padStart(2, '0')} · ${l.name}`;
  }
  refresh();

  const offLesson = store.subscribe(s => s.currentLesson, refresh);

  host.querySelector<HTMLButtonElement>('[data-action="pick"]')!.addEventListener('click', () => {
    openLessonPicker(store, (id) => { store.setLesson(id); onLessonChange(); });
  });
  host.querySelector<HTMLButtonElement>('[data-action="settings"]')!.addEventListener('click', () => {
    store.setView('settings');
  });

  return () => { offLesson(); host.replaceChildren(); };
}
