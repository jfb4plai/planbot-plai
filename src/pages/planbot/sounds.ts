// ===== PlanBot — sons Web Audio API =====

function tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
    osc.onended = () => ctx.close();
  } catch {
    // Audio non disponible (ex: navigateur sans interaction)
  }
}

export function playBad() {
  tone(220, 300, 'sawtooth', 0.2);
}

export function playGood() {
  tone(660, 150, 'sine', 0.25);
  setTimeout(() => tone(880, 150, 'sine', 0.2), 100);
}

export function playStar() {
  tone(523, 120);
  setTimeout(() => tone(659, 120), 100);
  setTimeout(() => tone(784, 120), 200);
  setTimeout(() => tone(1047, 300), 300);
}

export function playClick() {
  tone(440, 80, 'square', 0.1);
}
