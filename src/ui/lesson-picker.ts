import type { Store } from '../state/store';
import { ALL_LESSON_IDS, getLesson } from '../engine/lessons';
import type { LessonId } from '../types';
import { t } from '../i18n/i18n';

export function openLessonPicker(store: Store, onPick: (id: LessonId) => void): void {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal panel';
  modal.innerHTML = `
    <h2 style="font-family: var(--font-display); letter-spacing: 0.2em; color: var(--line-cyan); margin-bottom: var(--gap-md)">${t('picker.title').toUpperCase()}</h2>
    <div class="lesson-picker">
      ${ALL_LESSON_IDS.map(id => {
        const l = getLesson(id);
        const unlocked = id <= store.get().progress.unlockedLesson;
        const best = store.get().progress.perLessonBest[id];
        return `
          <div class="lesson-card" data-id="${id}" data-locked="${unlocked ? 0 : 1}">
            <div class="id">L${String(id).padStart(2, '0')}</div>
            <div class="name">${t('lesson.' + id)}</div>
            <div class="meta">${t('picker.passReq', { wpm: l.passWpm })}${best ? ` · ${t('picker.best', { wpm: best.wpm })}` : ''}</div>
          </div>`;
      }).join('')}
    </div>
    <div style="text-align:right; margin-top: var(--gap-md)"><button class="btn" data-close>${t('picker.cancel')}</button></div>
  `;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function close() { backdrop.remove(); }
  backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });
  modal.querySelector('[data-close]')!.addEventListener('click', close);
  modal.querySelectorAll<HTMLElement>('.lesson-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.dataset.locked === '1') return;
      const id = Number(card.dataset.id) as LessonId;
      onPick(id);
      close();
    });
  });
}
