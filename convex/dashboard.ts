import { v } from "convex/values";
import { query } from "./_generated/server";

export const getOverviewStats = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        const now = new Date();
        const BOGOTA_OFFSET = -5 * 60 * 60 * 1000;
        const nowBogota = new Date(now.getTime() + BOGOTA_OFFSET);

        // Start of today (midnight)
        const todayStart = new Date(
            nowBogota.getUTCFullYear(),
            nowBogota.getUTCMonth(),
            nowBogota.getUTCDate()
        ).getTime() - BOGOTA_OFFSET;

        // Start of 7 days ago
        const sevenDaysAgoStart = todayStart - (6 * 24 * 60 * 60 * 1000);

        // 1. Chats Urgentes (Human Attention)
        const urgentChatsCount = (await ctx.db
            .query("clientes")
            .withIndex("by_comercio_update", q => q.eq("comercio_id", args.comercio_id))
            .filter(q => q.eq(q.field("requiere_atencion_humana"), true))
            .collect()).length;

        // 2. Pedidos Pendientes
        const pendingOrdersCount = (await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", q => q.eq("comercio_id", args.comercio_id))
            .filter(q => q.eq(q.field("estado"), "pendiente"))
            .collect()).length;

        // 3. AI Stats (Sales & Time Saved)
        // This is an estimation query. In a real scenario, we might want to pre-calculate this.
        const allMessages = await ctx.db
            .query("mensajes")
            .withIndex("by_comercio", q => q.eq("comercio_id", args.comercio_id))
            .collect();

        const iaMessagesCount = allMessages.filter(m => m.es_ia).length;
        // Estimation: 2 minutes saved per IA message
        const hoursSaved = Math.round((iaMessagesCount * 2) / 60);

        // Sales attribution: Orders where the client interacts with IA could be attributed to IA.
        // For now, let's look at orders created today.
        const todayOrders = await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", q => q.eq("comercio_id", args.comercio_id))
            .filter(q => q.gte(q.field("_creationTime"), todayStart))
            .collect();

        const todaySales = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        // Let's assume a simplified attribution for now: if IA efficiency is high, attribution is high.
        // In the future we can link orders to specific sessions.
        const totalMessagesToday = allMessages.filter(m => m._creationTime >= todayStart).length;
        const iaMessagesToday = allMessages.filter(m => m._creationTime >= todayStart && m.es_ia).length;
        const dailyIaEfficiency = totalMessagesToday > 0 ? iaMessagesToday / totalMessagesToday : 0;

        // Attribution logic: If >50% of today's messages were IA, we attribute a percentage of sales.
        // This is a "fun" metric for motivation, not strict accounting.
        const iaSalesAttributed = Math.round(todaySales * dailyIaEfficiency);

        // 5. Weekly AI Activity (Chart Data)
        // We need messages from last 7 days where es_ia = true
        // For performance, we can just filter allMessages array (which loads everything). 
        // Optimization TODO: If messages table grows large, use a ranged query instead of loading all.

        const last7DaysMessages = allMessages.filter(m =>
            m._creationTime >= sevenDaysAgoStart && m._creationTime <= now.getTime()
        );

        const weeklyStats: Record<string, number> = {};
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            // Normalize key to handle potentially diverse locale strings, but readable for chart usually fine
            // We use day index to key map or just push to array at end
            weeklyStats[i] = 0; // Using index 0-6 as temp key, 0 = today, 6 = 7 days ago? No, loop goes 6->0
        }

        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayStart - (i * 24 * 60 * 60 * 1000));
            const dayStart = d.getTime();
            const dayEnd = dayStart + (24 * 60 * 60 * 1000);
            const dayName = d.toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'America/Bogota' });

            // Count for this day
            const count = last7DaysMessages.filter(m =>
                m._creationTime >= dayStart && m._creationTime < dayEnd && m.es_ia
            ).length;

            chartData.push({ day: dayName.charAt(0).toUpperCase() + dayName.slice(1), messages: count });
        }

        // 6. Activity Feed (Recent Items)
        const recentOrders = await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", q => q.eq("comercio_id", args.comercio_id))
            .order("desc")
            .take(5);

        const recentMessages = await ctx.db
            .query("mensajes")
            .withIndex("by_comercio", q => q.eq("comercio_id", args.comercio_id))
            .order("desc")
            .take(5);

        const activityFeed = [
            ...recentOrders.map(o => ({
                id: o._id,
                type: "order",
                title: `Pedido ${o.estado}`,
                description: `${o.cliente_nombre || 'Cliente'} - $${o.total}`,
                timestamp: o._creationTime,
                link: "/pedidos"
            })),
            ...recentMessages.map(m => ({
                id: m._id,
                type: "message",
                title: m.es_ia ? "IA Respondió" : (m.es_dueno ? "Tú respondiste" : "Mensaje recibido"),
                description: m.contenido.substring(0, 50) + "...",
                timestamp: m._creationTime,
                link: "/chats"
            }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

        return {
            urgentChatsCount,
            pendingOrdersCount,
            todaySales,
            hoursSaved,
            iaSalesAttributed,
            iaEfficiency: Math.round(dailyIaEfficiency * 100),
            activityFeed,
            weeklyAiChart: chartData
        };
    }
});
