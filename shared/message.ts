import type { Menu, Product } from "./types";
import { money, optionsOf, productTotal, variantOf, deliveryFee, type Selection } from "./price";

export interface OrderInput {
    code: string;
    store: Menu["store"];
    product: Product;
    sel: Selection;
    mode: "domicilio" | "retiro";
    name: string;
    lat?: number;
    lng?: number;
    reference?: string;
    payment: "efectivo" | "transferencia";
    cashAmount?: number;
}

export function orderTotal(o: Pick<OrderInput, "product" | "sel" | "mode" | "store">): number {
    return Math.round((productTotal(o.product, o.sel) + deliveryFee(o.mode, o.store.delivery.fee)) * 100) / 100;
}

/** Mensaje de WhatsApp del pedido (spec §8). */
export function buildMessage(o: OrderInput): string {
    const v = variantOf(o.product, o.sel);
    const lines: string[] = [`*Pedido #${o.code}* · ${o.store.name}`, ""];

    const head = o.product.variants.length > 1 ? `${o.product.name} · ${v.label}` : o.product.name;
    lines.push(`1× ${head} — ${money(productTotal(o.product, o.sel))}`);

    for (const g of o.product.groups) {
        const labels = (o.sel.picks[g.id] ?? []).flatMap((id) => g.options.find((x) => x.id === id)?.label ?? []);
        if (labels.length === 0) continue;
        if (g.prefix) lines.push(`   · ${g.prefix}: ${labels.join(", ")}`);
        else for (const l of labels) lines.push(`   · ${l}`);
    }

    const fee = deliveryFee(o.mode, o.store.delivery.fee);
    if (fee > 0) lines.push("", `Envío: ${money(fee)}`);
    lines.push("", `*Total: ${money(orderTotal(o))}*`, "", `Nombre: ${o.name.trim()}`);
    lines.push(`Entrega: ${o.mode === "domicilio" ? "a domicilio" : "retiro en el local"}`);
    if (o.mode === "domicilio") {
        if (o.lat !== undefined && o.lng !== undefined) lines.push(`Ubicación: https://maps.google.com/?q=${o.lat.toFixed(6)},${o.lng.toFixed(6)}`);
        if (o.reference?.trim()) lines.push(`Referencia: ${o.reference.trim()}`);
    }
    lines.push(`Pago: ${o.payment}${o.payment === "efectivo" && o.cashAmount ? ` (paga con ${money(o.cashAmount)})` : ""}`);
    return lines.join("\n");
}

export const waLink = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

// Reexport para quien solo necesite el detalle de extras.
export { optionsOf };
