import type { TypingEngine } from '../engine/typing-engine';
import { t } from '../i18n/i18n';

export type HudControl = {
  reset(): void;
  teardown(): void;
};

export function mountHudPanel(host: HTMLElement, engine: TypingEngine): HudControl {
  host.classList.add('hud-panel');
  host.innerHTML = `
    <div>
      <div class="hud-row"><span class="label">${t('hud.wpm')}</span><span class="value" data-field="wpm">0</span></div>
      <div class="hud-bar"><span data-field="wpm-bar" style="width:0%"></span></div>
    </div>
    <div>
      <div class="hud-row"><span class="label">${t('hud.accuracy')}</span><span class="value" data-field="acc">100%</span></div>
      <div class="hud-bar"><span data-field="acc-bar" style="width:100%"></span></div>
    </div>
    <div>
      <div class="hud-row"><span class="label">${t('hud.session')}</span><span class="value" data-field="time">00:00</span></div>
    </div>
    <div>
      <div class="label">${t('hud.errors')}</div>
      <div class="hud-errors" data-field="errors"></div>
    </div>
  `;
  const f = (name: string) => host.querySelector<HTMLElement>(`[data-field="${name}"]`)!;
  let startedAt = Date.now();
  let errorTally: Record<string, number> = {};

  function fmtTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function update(): void {
    const st = engine.getState();
    f('wpm').textContent = String(st.wpm);
    f('wpm-bar').style.width = `${Math.min(100, (st.wpm / 80) * 100)}%`;
    f('acc').textContent = `${Math.round(st.acc * 100)}%`;
    f('acc-bar').style.width = `${st.acc * 100}%`;
    const errEl = f('errors');
    const entries = Object.entries(errorTally).sort((a, b) => b[1] - a[1]).slice(0, 6);
    errEl.innerHTML = entries.length === 0
      ? `<span style="opacity:0.4">${t('hud.noErrors')}</span>`
      : entries.map(([k, n]) => `<span class="err">${escapeText(k)}×${n}</span>`).join('');
  }

  function tick(): void {
    f('time').textContent = fmtTime(Date.now() - startedAt);
    update();
  }
  const interval = window.setInterval(tick, 200);

  const off = engine.subscribe((e) => {
    if (e.type === 'wrong') errorTally[e.expected] = (errorTally[e.expected] ?? 0) + 1;
    update();
  });

  update();
  return {
    reset(): void {
      startedAt = Date.now();
      errorTally = {};
      update();
      f('time').textContent = '00:00';
    },
    teardown(): void { clearInterval(interval); off(); host.replaceChildren(); },
  };
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
