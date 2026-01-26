export function validateBusinessHours(horarioStr: string | undefined, bufferMinutes: number = 15): {
    estaAbierto: boolean;
    mensaje: string;
    cierraPronto: boolean;
} {
    if (!horarioStr) return { estaAbierto: true, mensaje: "", cierraPronto: false };

    try {
        const ahoraUTC = new Date();
        const BOGOTA_OFFSET = -5 * 60 * 60 * 1000; // Bogotá/Guayaquil UTC-5
        const ahora = new Date(ahoraUTC.getTime() + BOGOTA_OFFSET);
        const horaActual = ahora.getUTCHours();
        const minutoActual = ahora.getUTCMinutes();
        const horaEnMinutos = horaActual * 60 + minutoActual;

        // Formato esperado: "09:00 - 18:00" o similar
        const partes = horarioStr.split("-").map((s) => s.trim());
        if (partes.length !== 2)
            return { estaAbierto: true, mensaje: "", cierraPronto: false };

        const parseHora = (h: string) => {
            const [hh, mm] = h.split(":").map(Number);
            return hh * 60 + mm;
        };

        const inicio = parseHora(partes[0]);
        const fin = parseHora(partes[1]);

        const estaAbierto = horaEnMinutos >= inicio && horaEnMinutos <= fin;
        const cierraPronto = estaAbierto && fin - horaEnMinutos <= bufferMinutes;

        return {
            estaAbierto,
            mensaje: estaAbierto ? "" : `Estamos fuera de horario. Abrimos a las ${partes[0]}`,
            cierraPronto,
        };
    } catch (e) {
        return { estaAbierto: true, mensaje: "", cierraPronto: false };
    }
}
