import { IconOk } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Paleta única del panel: 8 colores que se leen bien con texto blanco u oscuro en el kiosko. */
export const COLORS = [
    { hex: "#C8321F", name: "Rojo" },
    { hex: "#F28C28", name: "Naranja" },
    { hex: "#F4B400", name: "Mostaza" },
    { hex: "#2E8B57", name: "Verde" },
    { hex: "#138D90", name: "Turquesa" },
    { hex: "#2B6CB0", name: "Azul" },
    { hex: "#6B46C1", name: "Morado" },
    { hex: "#2B2522", name: "Carbón" },
] as const;

/** ¿El fondo es claro? Decide si la marca de selección va oscura o blanca. */
function isLight(hex: string): boolean {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6;
}

/**
 * Selector de color con 8 opciones fijas, en vez de una rueda libre: es más rápido y todos los colores
 * funcionan bien en el kiosko. Si el comercio ya tenía otro color (de antes), aparece primero como «Actual».
 */
export function ColorPicker({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
    const current = value.toLowerCase();
    const custom = !COLORS.some((c) => c.hex.toLowerCase() === current);
    const options: { hex: string; name: string }[] = custom ? [{ hex: value, name: "Actual" }, ...COLORS] : [...COLORS];

    return (
        <div role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-3">
            {options.map((c) => {
                const on = c.hex.toLowerCase() === current;
                return (
                    <button
                        key={c.hex}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={c.name}
                        title={c.name}
                        onClick={() => onChange(c.hex)}
                        className={cn(
                            "flex h-14 items-center justify-center rounded-2xl border-2 transition-transform active:scale-95",
                            on ? "border-foreground" : "border-transparent",
                        )}
                        style={{ background: c.hex, color: isLight(c.hex) ? "#1a1412" : "#ffffff" }}
                    >
                        {on && <IconOk weight="bold" className="size-6" />}
                    </button>
                );
            })}
        </div>
    );
}
