import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";

export type OrderRow = FunctionReturnType<typeof api.orders.listMine>[number];
export type OpenOrder = Extract<OrderRow, { locked: false }>;
export type Status = OrderRow["status"];

export const money = (n: number) => `$${n.toFixed(2)}`;

export const STATUS_LABEL: Record<Status, string> = {
    enviado: "Nuevo",
    confirmado: "En curso",
    entregado: "Entregado",
    cancelado: "Cancelado",
};

/** La acción principal de cada estado: lo que casi siempre hay que hacer a continuación. */
export const NEXT_ACTION: Partial<Record<Status, { status: Status; label: string }>> = {
    enviado: { status: "confirmado", label: "Confirmar pedido" },
    confirmado: { status: "entregado", label: "Marcar entregado" },
};

export const timeOf = (ms: number) =>
    new Date(ms).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Guayaquil" });

export function ago(ms: number, now: number): string {
    const m = Math.max(0, Math.round((now - ms) / 60000));
    if (m < 1) return "ahora";
    if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60);
    return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

/** Resumen corto de una línea para la tarjeta: "Hamburguesa · Doble + 3 extras". */
export function itemSummary(o: OpenOrder): string {
    const it = o.items[0];
    if (!it) return "";
    const extras = it.options.length;
    return `${it.name}${it.variantLabel ? ` · ${it.variantLabel}` : ""}${extras > 0 ? ` + ${extras} extra${extras > 1 ? "s" : ""}` : ""}`;
}

/** Texto plano del pedido, para pegarlo en un chat o imprimirlo. */
export function ticketText(o: OpenOrder): string {
    const L: string[] = [`PEDIDO #${o.code} · ${timeOf(o.createdAt)}`, ""];
    for (const it of o.items) {
        L.push(`1x ${it.name}${it.variantLabel ? ` (${it.variantLabel})` : ""}`);
        for (const x of it.options) L.push(`   - ${x.prefix ? `${x.prefix} ` : ""}${x.label}`);
    }
    L.push("", `TOTAL: ${money(o.total)}`, "", `Cliente: ${o.customerName}`);
    L.push(`Entrega: ${o.mode === "domicilio" ? "A domicilio" : "Retiro en el local"}`);
    if (o.reference) L.push(`Referencia: ${o.reference}`);
    if (o.lat !== undefined && o.lng !== undefined) L.push(`Mapa: https://maps.google.com/?q=${o.lat},${o.lng}`);
    L.push(`Pago: ${o.payment}${o.payment === "efectivo" && o.cashAmount ? ` (paga con ${money(o.cashAmount)})` : ""}`);
    return L.join("\n");
}
