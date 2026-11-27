import { query } from "./_generated/server";
import { getOwnerId } from "./auth";

const DAY_MS = 24 * 3600 * 1000;
const round2 = (n: number) => Math.round(n * 100) / 100;
const ecuadorDay = (ms: number) => new Date(ms - 5 * 3600 * 1000).toISOString().slice(0, 10); // UTC−5

/**
 * Reportes sencillos (spec §12.5). Se leen de `dailyStats`, no recorriendo pedidos, salvo el origen del QR
 * y los más pedidos, que miran solo los pedidos del mes. Plan gratuito: únicamente el total del mes;
 * el resto se calcula solo para Pro (se decide aquí, en el servidor).
 */
export const summary = query({
    args: {},
    handler: async (ctx) => {
        const ownerId = await getOwnerId(ctx);
        if (!ownerId) return null;
        const store = await ctx.db.query("stores").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).first();
        if (!store) return null;

        const now = Date.now();
        const today = ecuadorDay(now);
        const monthKey = today.slice(0, 7);
        const pro = store.plan === "pro" && (!store.planUntil || store.planUntil > now);

        const monthDays = await ctx.db
            .query("dailyStats")
            .withIndex("by_store_day", (q) => q.eq("storeId", store._id).gte("day", `${monthKey}-01`).lte("day", `${monthKey}-31`))
            .collect();
        const orders = monthDays.reduce((t, d) => t + d.orders, 0);
        const revenue = round2(monthDays.reduce((t, d) => t + d.revenue, 0));
        const month = { key: monthKey, orders, revenue, avgTicket: orders > 0 ? round2(revenue / orders) : 0 };

        if (!pro) return { pro: false as const, month };

        // Últimos 7 días (incluye hoy), con ceros donde no hubo pedidos.
        const days: string[] = [];
        for (let i = 6; i >= 0; i--) days.push(ecuadorDay(now - i * DAY_MS));
        const weekRows = await ctx.db
            .query("dailyStats")
            .withIndex("by_store_day", (q) => q.eq("storeId", store._id).gte("day", days[0]).lte("day", days[6]))
            .collect();
        const byDay = new Map(weekRows.map((r) => [r.day, r]));
        const last7 = days.map((day) => ({ day, orders: byDay.get(day)?.orders ?? 0, revenue: round2(byDay.get(day)?.revenue ?? 0) }));
        const sum = (rows: typeof last7) => ({ orders: rows.reduce((t, r) => t + r.orders, 0), revenue: round2(rows.reduce((t, r) => t + r.revenue, 0)) });

        const delivery = monthDays.reduce((t, d) => t + d.deliveryOrders, 0);

        // Más pedidos y origen: solo los pedidos válidos del mes.
        const monthStartMs = new Date(`${monthKey}-01T00:00:00Z`).getTime() + 5 * 3600 * 1000;
        const monthOrders = await ctx.db
            .query("orders")
            .withIndex("by_store_created", (q) => q.eq("storeId", store._id).gte("createdAt", monthStartMs))
            .take(1000);
        const valid = monthOrders.filter((o) => o.status !== "cancelado");
        const tally = (keys: (string | undefined)[]) => {
            const m = new Map<string, number>();
            for (const k of keys) if (k) m.set(k, (m.get(k) ?? 0) + 1);
            return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        };
        const products = tally(valid.map((o) => (o.items as { name: string }[])[0]?.name)).map(([name, orders]) => ({ name, orders }));
        const sources = tally(valid.map((o) => o.src)).map(([src, orders]) => ({ src, orders }));

        return {
            pro: true as const,
            month,
            today: { day: today, ...sum(last7.slice(6)) },
            week: sum(last7),
            last7,
            deliveryPct: orders > 0 ? Math.round((delivery / orders) * 100) : 0,
            products,
            sources,
        };
    },
});
