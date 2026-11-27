/**
 * Normaliza un número de WhatsApp a formato internacional sin "+", que es lo que pide wa.me (spec §5.1).
 * Acepta como se escribe en Ecuador: "0988200451", "098 820 0451", "+593 98 820 0451", "988200451".
 * Devuelve null si no parece un número válido.
 */
export function normalizeWhatsApp(input: string, defaultCountry = "593"): string | null {
    let d = input.replace(/\D/g, "");
    if (d.startsWith("00")) d = d.slice(2); // 00593…
    else if (d.startsWith("0")) d = defaultCountry + d.slice(1); // 0988200451 → 593988200451
    else if (d.length === 9 && d.startsWith("9")) d = defaultCountry + d; // 988200451 → 593988200451
    return d.length >= 10 && d.length <= 15 ? d : null;
}

/** "593988200451" → "+593 98 820 0451" (solo para mostrar). */
export function formatWhatsApp(n: string): string {
    if (n.startsWith("593") && n.length === 12) return `+593 ${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
    return `+${n}`;
}
