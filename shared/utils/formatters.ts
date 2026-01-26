/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Formatea una fecha relativa (ej: "hace 5 minutos")
 */
export function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;

    return formatDate(timestamp);
}

/**
 * Formatea una fecha completa
 */
export function formatDate(timestamp: number): string {
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(timestamp);
}

/**
 * Formatea un número de teléfono
 */
export function formatPhone(phone: string): string {
    // Eliminar caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '');

    // Formato colombiano: +57 XXX XXX XXXX
    if (cleaned.length === 10) {
        return `+57 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }

    return phone;
}
