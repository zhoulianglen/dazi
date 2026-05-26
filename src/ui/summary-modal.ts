import type { SessionStats } from '../types';
import { passesLesson, getLesson } from '../engine/lessons';
import { fingerOf } from '../engine/finger-map';
import { t } from '../i18n/i18n';

export function openSummary(
  stats: SessionStats,
  onRetry: () => void,
  onNext: () => void,
): void {
  const lesson = getLesson(stats.lessonId);
  const passed = passesLesson(stats.lessonId, stats);

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal panel summary';

  const slowItems = stats.slowPairs.slice(0, 5).map(p => {
    const f = fingerOf(p.to);
    const hint = f ? t('finger.' + f) : '?';
    return `<div class="slow">  <b>${escapeText(p.from)} → ${escapeText(p.to)}</b>: ${t('summary.slowItem', { from: escapeText(p.from), to: escapeText(p.to), ms: p.meanMs, threshold: p.thresholdMs, finger: hint })}</div>`;
  }).join('') || `<div class="slow" style="opacity:0.5">${t('summary.noSlowPairs')}</div>`;

  modal.innerHTML = `
    <div class="verdict ${passed ? 'pass' : 'fail'}">${passed ? t('summary.complete') : t('summary.fail')}</div>
    <div class="big">
      <div><div class="label">${t('summary.wpm')}</div><div class="value">${stats.wpm}</div></div>
      <div><div class="label">${t('summary.acc')}</div><div class="value">${Math.round(stats.acc * 100)}%</div></div>
      <div><div class="label">${t('summary.time')}</div><div class="value">${(stats.durationMs / 1000).toFixed(1)}s</div></div>
    </div>
    <div>
      <div class="tag">${t('summary.passThreshold')}</div>
      <div style="font-size:13px; color:var(--text-dim); margin-top:4px">
        ${t('summary.passDetail', { wpm: lesson.passWpm, acc: Math.round(lesson.passAcc * 100) })}
      </div>
    </div>
    <div>
      <div class="tag">${t('summary.slowPairs')}</div>
      <div class="slow-list" style="margin-top:6px">${slowItems}</div>
    </div>
    <div class="actions">
      <button class="btn" data-action="retry">${t('summary.retry')}</button>
      ${passed ? `<button class="btn" data-action="next">${t('summary.next')}</button>` : ''}
    </div>
  `;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  function close() { backdrop.remove(); }
  modal.querySelector('[data-action="retry"]')!.addEventListener('click', () => { close(); onRetry(); });
  const nextBtn = modal.querySelector('[data-action="next"]');
  if (nextBtn) nextBtn.addEventListener('click', () => { close(); onNext(); });
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
