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
        const best = store.get().progress.perLessonBest[id];
        const passed = !!best && best.wpm >= l.passWpm && best.acc >= l.passAcc;
        return `
          <div class="lesson-card" data-id="${id}" data-passed="${passed ? 1 : 0}">
            <div class="id">L${String(id).padStart(2, '0')}${passed ? ' <span class="check">✓</span>' : ''}</div>
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
      const id = Number(card.dataset.id) as LessonId;
      onPick(id);
      close();
    });
  });
}
