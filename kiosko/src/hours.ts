import type { Menu } from "../../shared/types";

/** ¿Está abierto ahora? Horario en America/Guayaquil (UTC−5, sin horario de verano). Sin `hours` siempre abierto. */
export function isOpen(hours: Menu["store"]["hours"], now = new Date()): boolean {
    if (!hours || hours.length !== 7) return true;
    const local = new Date(now.getTime() - 5 * 3600 * 1000); // lunes=0
    const day = (local.getUTCDay() + 6) % 7;
    const mins = local.getUTCHours() * 60 + local.getUTCMinutes();
    const toMin = (s: string) => {
        const [h, m] = s.split(":").map(Number);
        return h * 60 + (m || 0);
    };
    const today = hours[day];
    const yesterday = hours[(day + 6) % 7];
    if (today) {
        const o = toMin(today.open), c = toMin(today.close);
        if (c > o ? mins >= o && mins < c : mins >= o) return true; // cierra pasada la medianoche
    }
    if (yesterday) {
        const o = toMin(yesterday.open), c = toMin(yesterday.close);
        if (c <= o && mins < c) return true; // sigue abierto del turno de ayer
    }
    return false;
}
