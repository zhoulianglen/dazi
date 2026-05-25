import type { SessionStats } from '../types';
import { passesLesson, getLesson } from '../engine/lessons';
import { fingerOf } from '../engine/finger-map';

const FINGER_LABEL: Record<string, string> = {
  'L-pinky': '左手小指', 'L-ring': '左手无名指', 'L-mid': '左手中指', 'L-index': '左手食指', 'L-thumb': '左手拇指',
  'R-thumb': '右手拇指', 'R-index': '右手食指', 'R-mid': '右手中指', 'R-ring': '右手无名指', 'R-pinky': '右手小指',
};

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
    const hint = f ? FINGER_LABEL[f] : '?';
    return `<div class="slow">  <b>${escapeText(p.from)} → ${escapeText(p.to)}</b>: ${p.meanMs}ms (上限 ${p.thresholdMs}ms) · 应使用 ${hint}</div>`;
  }).join('') || '<div class="slow" style="opacity:0.5">无慢键 · 节奏达标</div>';

  modal.innerHTML = `
    <div class="verdict ${passed ? 'pass' : 'fail'}">${passed ? '◆ LESSON COMPLETE ◆' : '— RETRY —'}</div>
    <div class="big">
      <div><div class="label">WPM</div><div class="value">${stats.wpm}</div></div>
      <div><div class="label">Accuracy</div><div class="value">${Math.round(stats.acc * 100)}%</div></div>
      <div><div class="label">Time</div><div class="value">${(stats.durationMs / 1000).toFixed(1)}s</div></div>
    </div>
    <div>
      <div class="tag">Pass threshold</div>
      <div style="font-size:13px; color:var(--text-dim); margin-top:4px">
        需要 ≥ ${lesson.passWpm} WPM · ≥ ${Math.round(lesson.passAcc * 100)}%
      </div>
    </div>
    <div>
      <div class="tag">Slow pairs (handness signal)</div>
      <div class="slow-list" style="margin-top:6px">${slowItems}</div>
    </div>
    <div class="actions">
      <button class="btn" data-action="retry">Retry</button>
      ${passed ? '<button class="btn" data-action="next">Next Lesson →</button>' : ''}
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
