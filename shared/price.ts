import type { Product } from "./types";

/** Lo que el cliente eligió de un producto: variante y opciones por grupo. */
export interface Selection {
    variantId: string;
    picks: Record<string, string[]>; // groupId -> ids de opciones
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const money = (n: number) => `$${n.toFixed(2)}`;

export function variantOf(p: Product, sel: Pick<Selection, "variantId">) {
    return p.variants.find((v) => v.id === sel.variantId) ?? p.variants[0];
}

export function optionsOf(p: Product, sel: Selection) {
    return p.groups.flatMap((g) =>
        (sel.picks[g.id] ?? []).flatMap((id) => {
            const option = g.options.find((o) => o.id === id);
            return option ? [{ group: g, option }] : [];
        }),
    );
}

/** Precio del producto con su variante y extras (sin envío). El servidor recalcula con la misma regla. */
export function productTotal(p: Product, sel: Selection): number {
    return round2(variantOf(p, sel).price + optionsOf(p, sel).reduce((t, x) => t + x.option.price, 0));
}

export function deliveryFee(mode: "domicilio" | "retiro", fee?: number): number {
    return mode === "domicilio" ? round2(fee ?? 0) : 0;
}
