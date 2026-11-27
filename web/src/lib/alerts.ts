// Avisos de pedido nuevo con la app abierta: sonido, vibración y globo en el ícono (spec §12.4).
// El audio exige un primer toque del usuario, por eso existe el botón "Activar sonido".

const KEY = "waada-sound";
let ctx: AudioContext | null = null;

export const isSoundOn = () => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

function audio(): AudioContext | null {
    if (!ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
}

function tone(c: AudioContext, freq: number, start: number, dur: number) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.4, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.05);
}

export function playBeep() {
    const c = audio();
    if (!c) return;
    tone(c, 880, 0, 0.18);
    tone(c, 1175, 0.22, 0.18);
    tone(c, 880, 0.44, 0.3);
}

export function setSound(on: boolean) {
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* sin almacenamiento */ }
    if (on) playBeep(); // se llama desde un toque: aquí se desbloquea el audio
}

export function notifyNewOrder() {
    if (isSoundOn()) playBeep();
    try { navigator.vibrate?.([200, 100, 200]); } catch { /* no soportado */ }
}

export function setBadge(n: number) {
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    try { void (n > 0 ? nav.setAppBadge?.(n) : nav.clearAppBadge?.()); } catch { /* no soportado */ }
}
