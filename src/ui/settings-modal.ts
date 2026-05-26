import type { Store } from '../state/store';
import { exportAll, importAll } from '../state/persistence';
import { t } from '../i18n/i18n';

export function mountSettingsWatcher(store: Store): () => void {
  return store.subscribe(s => s.view, (view) => {
    if (view === 'settings') openSettings(store);
  });
}

function openSettings(store: Store): void {
  const s = store.get().settings;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal panel settings';
  modal.innerHTML = `
    <h2 style="font-family:var(--font-display); letter-spacing:0.2em; color:var(--line-cyan)">${t('settings.title').toUpperCase()}</h2>
    <div class="row">
      <label>${t('settings.sound')}</label>
      <input type="checkbox" data-field="audio" ${s.audioEnabled ? 'checked' : ''}/>
    </div>
    <div class="row">
      <label>${t('settings.volume')}</label>
      <input type="range" min="0" max="1" step="0.05" value="${s.audioVolume}" data-field="vol"/>
    </div>
    <div class="row">
      <label>${t('settings.reducedMotion')}</label>
      <input type="checkbox" data-field="rm" ${s.reducedMotion ? 'checked' : ''}/>
    </div>
    <hr style="border-color: var(--line-cyan-dim); opacity: 0.5"/>
    <div class="row">
      <button class="btn" data-action="export">${t('settings.export')}</button>
      <button class="btn" data-action="import">${t('settings.import')}</button>
      <input type="file" accept="application/json" class="file"/>
    </div>
    <div class="row" style="justify-content:flex-end">
      <button class="btn" data-action="close">${t('settings.close')}</button>
    </div>
  `;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function close() { backdrop.remove(); store.setView('practicing'); }
  modal.querySelector('[data-action="close"]')!.addEventListener('click', close);
  backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });

  modal.querySelector<HTMLInputElement>('[data-field="audio"]')!.addEventListener('change', (ev) => {
    store.updateSettings({ audioEnabled: (ev.target as HTMLInputElement).checked });
  });
  modal.querySelector<HTMLInputElement>('[data-field="vol"]')!.addEventListener('input', (ev) => {
    store.updateSettings({ audioVolume: Number((ev.target as HTMLInputElement).value) });
  });
  modal.querySelector<HTMLInputElement>('[data-field="rm"]')!.addEventListener('change', (ev) => {
    const v = (ev.target as HTMLInputElement).checked;
    store.updateSettings({ reducedMotion: v });
    document.documentElement.classList.toggle('reduced-motion', v);
  });

  modal.querySelector('[data-action="export"]')!.addEventListener('click', () => {
    const blob = JSON.stringify(exportAll(), null, 2);
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `dazi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  const file = modal.querySelector<HTMLInputElement>('.file')!;
  modal.querySelector('[data-action="import"]')!.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      importAll(JSON.parse(await f.text()));
      alert(t('settings.importDone'));
      location.reload();
    } catch (err) {
      alert(t('settings.importFail', { msg: (err as Error).message }));
    }
  });
}
