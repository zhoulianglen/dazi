import type { Store } from '../state/store';
import { openLessonPicker } from './lesson-picker';
import { t, getLocale } from '../i18n/i18n';

export function mountTopbar(host: HTMLElement, store: Store, onLessonChange: () => void): () => void {
  host.classList.add('topbar');

  function render(): void {
    const id = store.get().currentLesson;
    host.innerHTML = `
      <div class="brand">${t('brand')}</div>
      <div class="controls">
        <span class="tag" data-field="current">L${String(id).padStart(2, '0')} · ${t('lesson.' + id)}</span>
        <button class="btn" data-action="pick">${t('topbar.changeLesson')}</button>
        <button class="btn" data-action="lang">${t('topbar.langToggle')}</button>
        <button class="btn" data-action="settings">⚙</button>
      </div>
    `;

    host.querySelector<HTMLButtonElement>('[data-action="pick"]')!.addEventListener('click', () => {
      openLessonPicker(store, (lid) => { store.setLesson(lid); onLessonChange(); });
    });
    host.querySelector<HTMLButtonElement>('[data-action="lang"]')!.addEventListener('click', () => {
      const next: 'zh' | 'en' = getLocale() === 'zh' ? 'en' : 'zh';
      store.updateSettings({ locale: next });
      location.reload();
    });
    host.querySelector<HTMLButtonElement>('[data-action="settings"]')!.addEventListener('click', () => {
      store.setView('settings');
    });
  }

  render();

  const offLesson = store.subscribe(s => s.currentLesson, render);

  return () => { offLesson(); host.replaceChildren(); };
}
