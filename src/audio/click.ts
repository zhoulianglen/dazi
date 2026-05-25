import type { Store } from '../state/store';
import type { TypingEngine } from '../engine/typing-engine';

let ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function blip(freq: number, durMs: number, volume: number): void {
  const ac = getCtx();
  if (ac.state === 'suspended') ac.resume();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.5), t + durMs / 1000);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + durMs / 1000);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + durMs / 1000);
}

export function mountAudio(store: Store, engine: TypingEngine): () => void {
  return engine.subscribe((e) => {
    const s = store.get().settings;
    if (!s.audioEnabled) return;
    if (e.type === 'correct') blip(1200, 30, s.audioVolume * 0.4);
    else if (e.type === 'wrong') blip(180, 80, s.audioVolume * 0.6);
  });
}
