import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { getOwnerId, requireOwnerId } from "./auth";
import { LIMITS } from "../shared/limits";
import { deliveryFee, optionsOf, productTotal, variantOf } from "../shared/price";

/** Una línea del pedido, tal como se guarda (sin referencias al menú, que puede cambiar). */
export interface OrderItem {
    productId: string;
    name: string;
    variantLabel?: string;
    options: { group: string; prefix?: string; label: string; price: number }[];
    price: number;
}

const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;
const MAX_ORDERS_PER_HOUR_PER_SESSION = 5;
const ecuador = () => new Date(Date.now() - 5 * 3600 * 1000).toISOString(); // UTC−5, sin horario de verano

const vMode = v.union(v.literal("domicilio"), v.literal("retiro"));
const vPayment = v.union(v.literal("efectivo"), v.literal("transferencia"));

/** Lo que envía el kiosko por /api/pedido. El servidor no confía en ningún precio: recalcula todo. */
export const orderArgs = {
    slug: v.string(),
    sessionId: v.string(),
    code: v.string(),
    productId: v.string(),
    variantId: v.string(),
    picks: v.record(v.string(), v.array(v.string())),
    mode: vMode,
    name: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    accuracy: v.optional(v.number()),
    reference: v.optional(v.string()),
    payment: vPayment,
    cashAmount: v.optional(v.number()),
    clientTotal: v.number(),
    src: v.optional(v.string()),
};

/** Solo la llama la acción HTTP /pedido (que exige x-waada-key). Idempotente por (sessionId, code). */
export const create = internalMutation({
    args: orderArgs,
    handler: async (ctx, a) => {
        const store = await ctx.db.query("stores").withIndex("by_slug", (q) => q.eq("slug", a.slug)).first();
        const menu = store?.publishedMenu;
        if (!store || !menu) throw new Error("Comercio no encontrado");

        if (!CODE_RE.test(a.code)) throw new Error("Código inválido");
        if (a.sessionId.length < 8 || a.sessionId.length > 64) throw new Error("Sesión inválida");

        // Reintentos del mismo pedido (el navegador puede enviar dos veces): no se duplica.
        const same = await ctx.db
            .query("orders")
            .withIndex("by_store_session_code", (q) => q.eq("storeId", store._id).eq("sessionId", a.sessionId).eq("code", a.code))
            .first();
        if (same) return { id: same._id, duplicate: true };

        // Límite por sesión: 5 pedidos por hora.
        const since = Date.now() - 3600 * 1000;
        const recent = await ctx.db
            .query("orders")
            .withIndex("by_store_session_code", (q) => q.eq("storeId", store._id).eq("sessionId", a.sessionId))
            .collect();
        if (recent.filter((o) => o.createdAt > since).length >= MAX_ORDERS_PER_HOUR_PER_SESSION) throw new Error("Demasiados pedidos");

        // Validar contra el menú publicado.
        const product = menu.products.find((p) => p.id === a.productId);
        if (!product || !product.available) throw new Error("Producto no disponible");
        if (!product.variants.some((x) => x.id === a.variantId)) throw new Error("Variante inválida");
        for (const g of product.groups) {
            const chosen = a.picks[g.id] ?? [];
            if (new Set(chosen).size !== chosen.length) throw new Error("Opciones repetidas");
            if (chosen.some((id) => !g.options.some((o) => o.id === id))) throw new Error("Opción inválida");
            if (g.type === "one" && chosen.length !== 1) throw new Error("Falta elegir una opción");
            if (g.type === "many" && g.max && chosen.length > g.max) throw new Error("Demasiadas opciones");
        }
        if (Object.keys(a.picks).some((k) => !product.groups.some((g) => g.id === k))) throw new Error("Grupo inválido");

        const { delivery, payments } = menu.store;
        if (a.mode === "domicilio" && !delivery.enabled) throw new Error("No hay domicilio");
        if (a.mode === "retiro" && !delivery.pickup) throw new Error("No hay retiro");
        if (!payments.includes(a.payment)) throw new Error("Forma de pago no disponible");

        const name = a.name.trim();
        if (name.length < 2 || name.length > 60) throw new Error("Nombre inválido");
        const reference = a.reference?.trim().slice(0, 200) || undefined;
        const hasGeo = a.lat !== undefined && a.lng !== undefined;
        if (hasGeo && !(Math.abs(a.lat!) <= 90 && Math.abs(a.lng!) <= 180)) throw new Error("Ubicación inválida");
        if (a.mode === "domicilio" && !hasGeo && (reference?.length ?? 0) <= 5) throw new Error("Falta la ubicación o referencia");
        if (a.cashAmount !== undefined && !(a.cashAmount >= 0 && a.cashAmount < 100000)) throw new Error("Monto inválido");
        if (!(a.clientTotal >= 0 && a.clientTotal < 100000)) throw new Error("Total inválido");

        // El servidor recalcula el total con el menú publicado (spec §8).
        const sel = { variantId: a.variantId, picks: a.picks };
        const serverTotal = Math.round((productTotal(product, sel) + deliveryFee(a.mode, delivery.fee)) * 100) / 100;
        const mismatch = Math.abs(serverTotal - a.clientTotal) > 0.005;

        const items: OrderItem[] = [
            {
                productId: product.id,
                name: product.name,
                variantLabel: product.variants.length > 1 ? variantOf(product, sel).label : undefined,
                options: optionsOf(product, sel).map(({ group, option }) => ({ group: group.title, prefix: group.prefix, label: option.label, price: option.price })),
                price: productTotal(product, sel),
            },
        ];

        // Contadores: nunca una fila por evento.
        const stamp = ecuador();
        const monthKey = stamp.slice(0, 7);
        const day = stamp.slice(0, 10);
        const counter = await ctx.db.query("counters").withIndex("by_store_month", (q) => q.eq("storeId", store._id).eq("monthKey", monthKey)).first();
        const monthSeq = (counter?.orders ?? 0) + 1;
        if (counter) await ctx.db.patch(counter._id, { orders: monthSeq });
        else await ctx.db.insert("counters", { storeId: store._id, monthKey, orders: monthSeq });

        const stats = await ctx.db.query("dailyStats").withIndex("by_store_day", (q) => q.eq("storeId", store._id).eq("day", day)).first();
        const isDelivery = a.mode === "domicilio" ? 1 : 0;
        if (stats) {
            await ctx.db.patch(stats._id, { orders: stats.orders + 1, revenue: Math.round((stats.revenue + serverTotal) * 100) / 100, deliveryOrders: stats.deliveryOrders + isDelivery });
        } else {
            await ctx.db.insert("dailyStats", { storeId: store._id, day, orders: 1, revenue: serverTotal, upsellOrders: 0, deliveryOrders: isDelivery });
        }

        const id = await ctx.db.insert("orders", {
            storeId: store._id,
            code: a.code,
            sessionId: a.sessionId,
            items,
            clientTotal: a.clientTotal,
            serverTotal,
            mismatch,
            customerName: name,
            mode: a.mode,
            lat: a.lat,
            lng: a.lng,
            accuracy: a.accuracy,
            reference,
            payment: a.payment,
            cashAmount: a.cashAmount,
            status: "enviado",
            src: a.src && /^[a-z0-9-]{2,30}$/.test(a.src) ? a.src : undefined,
            monthKey,
            monthSeq,
            createdAt: Date.now(),
        });
        return { id, duplicate: false };
    },
});

const isPro = (s: Doc<"stores">) => s.plan === "pro" && (!s.planUntil || s.planUntil > Date.now());

/**
 * Pedidos recientes del comercio (reactiva). En el plan gratuito, desde el pedido 51 del mes se ocultan
 * los detalles AQUÍ, en el servidor (spec §12b): el cliente nunca recibe lo que no debe ver.
 */
export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const ownerId = await getOwnerId(ctx);
        if (!ownerId) return [];
        const store = await ctx.db.query("stores").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).first();
        if (!store) return [];
        const rows = await ctx.db.query("orders").withIndex("by_store_created", (q) => q.eq("storeId", store._id)).order("desc").take(100);
        const pro = isPro(store);
        return rows.map((o) => {
            const locked = !pro && o.monthSeq > LIMITS.freeOrdersPerMonth;
            if (locked) {
                return { _id: o._id, code: o.code, createdAt: o.createdAt, status: o.status, monthSeq: o.monthSeq, locked: true as const };
            }
            return {
                _id: o._id,
                code: o.code,
                createdAt: o.createdAt,
                status: o.status,
                monthSeq: o.monthSeq,
                locked: false as const,
                items: o.items as OrderItem[],
                total: o.serverTotal,
                clientTotal: o.clientTotal,
                mismatch: o.mismatch,
                customerName: o.customerName,
                mode: o.mode,
                lat: o.lat,
                lng: o.lng,
                accuracy: o.accuracy,
                reference: o.reference,
                payment: o.payment,
                cashAmount: o.cashAmount,
                src: o.src,
            };
        });
    },
});

const NEXT: Record<Doc<"orders">["status"], Doc<"orders">["status"][]> = {
    enviado: ["confirmado", "cancelado"],
    confirmado: ["entregado", "cancelado"],
    entregado: [],
    cancelado: [],
};

export const setStatus = mutation({
    args: { id: v.id("orders"), status: v.union(v.literal("enviado"), v.literal("confirmado"), v.literal("entregado"), v.literal("cancelado")) },
    handler: async (ctx, { id, status }) => {
        const ownerId = await requireOwnerId(ctx);
        const order = await ctx.db.get(id);
        const store = order ? await ctx.db.get(order.storeId) : null;
        if (!order || !store || store.ownerId !== ownerId) throw new Error("Pedido no encontrado");
        if (!isPro(store) && order.monthSeq > LIMITS.freeOrdersPerMonth) throw new Error("Activa Pro para gestionar este pedido");
        if (!NEXT[order.status].includes(status)) throw new Error("Cambio de estado no permitido");
        await ctx.db.patch(id, { status });
    },
});
