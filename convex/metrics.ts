import { v } from "convex/values";
import { query } from "./_generated/server";

export const getSummary = query({
    args: {
        comercio_id: v.id("comercios"),
        filtro: v.union(v.literal("hoy"), v.literal("ayer"), v.literal("7dias"), v.literal("30dias")),
    },
    handler: async (ctx, args) => {
        const now = new Date();
        let startTime: number;
        let endTime: number = now.getTime();

        const BOGOTA_OFFSET = -5 * 60 * 60 * 1000;
        const nowBogota = new Date(now.getTime() + BOGOTA_OFFSET);
        const todayStart = new Date(
            nowBogota.getUTCFullYear(),
            nowBogota.getUTCMonth(),
            nowBogota.getUTCDate()
        ).getTime() - BOGOTA_OFFSET;

        if (args.filtro === "hoy") {
            startTime = todayStart;
        } else if (args.filtro === "ayer") {
            startTime = todayStart - 24 * 60 * 60 * 1000;
            endTime = todayStart;
        } else if (args.filtro === "7dias") {
            startTime = todayStart - 7 * 24 * 60 * 60 * 1000;
        } else { // 30dias
            startTime = todayStart - 30 * 24 * 60 * 60 * 1000;
        }

        // 1. Fetch Orders in range
        const orders = await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .filter((q) => q.and(
                q.gte(q.field("_creationTime"), startTime),
                q.lt(q.field("_creationTime"), endTime),
                q.neq(q.field("estado"), "borrador"),
                q.neq(q.field("estado"), "cancelado")
            ))
            .collect();

        const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const orderCount = orders.length;

        // 2. Best-selling products
        const productCounts: Record<string, number> = {};
        orders.forEach(order => {
            if (Array.isArray(order.detalles)) {
                order.detalles.forEach((item: any) => {
                    const name = item.nombre || "Producto desconocido";
                    const qty = item.cantidad || 1;
                    productCounts[name] = (productCounts[name] || 0) + qty;
                });
            }
        });

        const topProducts = Object.entries(productCounts)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);

        // 3. New Clients in range
        const newClients = await ctx.db
            .query("clientes")
            .withIndex("by_comercio_update", (q) => q.eq("comercio_id", args.comercio_id))
            .filter((q) => q.and(
                q.gte(q.field("_creationTime"), startTime),
                q.lt(q.field("_creationTime"), endTime)
            ))
            .collect();

        // 4. Efficiency IA
        const messages = await ctx.db
            .query("mensajes")
            .filter((q) => q.and(
                q.eq(q.field("comercio_id"), args.comercio_id),
                q.gte(q.field("_creationTime"), startTime),
                q.lt(q.field("_creationTime"), endTime)
            ))
            .collect();

        const totalMessages = messages.length;
        const iaMessages = messages.filter(m => m.es_ia).length;
        const iaEfficiency = totalMessages > 0 ? (iaMessages / totalMessages) * 100 : 0;

        // 5. Conversion Rate
        // Simplified: Orders created by distinct clients in range / Total clients seen in range
        const clientsWithOrders = new Set(orders.filter(o => o.cliente_id).map(o => o.cliente_id!.toString())).size;
        const totalClientsInRange = new Set(messages.map(m => m.cliente_id.toString())).size;
        const conversionRate = totalClientsInRange > 0 ? (clientsWithOrders / totalClientsInRange) * 100 : 0;

        const averageTicket = orderCount > 0 ? revenue / orderCount : 0;

        // 6. Sales by Category
        // First get all products to map name -> category
        const products = await ctx.db
            .query("productos")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .collect();
        const productToCategory: Record<string, string> = {};
        products.forEach(p => productToCategory[p.nombre] = p.categoria);

        const categorySales: Record<string, number> = {};
        orders.forEach(order => {
            if (Array.isArray(order.detalles)) {
                order.detalles.forEach((item: any) => {
                    const cat = productToCategory[item.nombre] || "Sin Categoría";
                    categorySales[cat] = (categorySales[cat] || 0) + ((item.precio || 0) * (item.cantidad || 1));
                });
            }
        });
        const topCategories = Object.entries(categorySales)
            .map(([nombre, total]) => ({ nombre, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // 7. Top Clients (VIP)
        const clientRevenue: Record<string, { total: number; nombre: string }> = {};
        orders.forEach(order => {
            if (order.cliente_id) {
                const id = order.cliente_id.toString();
                if (!clientRevenue[id]) {
                    clientRevenue[id] = { total: 0, nombre: order.cliente_nombre || "Cliente Desconocido" };
                }
                clientRevenue[id].total += order.total;
            }
        });
        const topClients = Object.entries(clientRevenue)
            .map(([id, info]) => ({ id, ...info }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // 8. Peak Hours
        const hourlyOrders: Record<number, number> = {};
        for (let i = 0; i < 24; i++) hourlyOrders[i] = 0;

        orders.forEach(order => {
            // Ajustamos la hora del pedido a la zona horaria local
            const date = new Date(order._creationTime + BOGOTA_OFFSET);
            const hour = date.getUTCHours();
            hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
        });
        const peakHours = Object.entries(hourlyOrders)
            .map(([hora, cantidad]) => ({ hora: parseInt(hora), cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);

        // 9. Incomplete Sales (drafts)
        const incompleteSales = await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .filter((q) => q.and(
                q.eq(q.field("estado"), "borrador"),
                q.gte(q.field("_creationTime"), startTime)
            ))
            .order("desc")
            .take(5);

        return {
            revenue,
            orderCount,
            newClients: newClients.length,
            iaEfficiency,
            conversionRate,
            averageTicket,
            topProducts,
            topCategories,
            topClients,
            peakHours,
            incompleteSales,
        };
    },
});
export const getFilterCounts = query({
    args: {
        comercio_id: v.id("comercios"),
    },
    handler: async (ctx, args) => {
        const now = new Date();
        const BOGOTA_OFFSET = -5 * 60 * 60 * 1000;
        const nowBogota = new Date(now.getTime() + BOGOTA_OFFSET);
        const todayStart = new Date(
            nowBogota.getUTCFullYear(),
            nowBogota.getUTCMonth(),
            nowBogota.getUTCDate()
        ).getTime() - BOGOTA_OFFSET;

        const allOrders = await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .filter((q) => q.and(
                q.neq(q.field("estado"), "borrador"),
                q.neq(q.field("estado"), "cancelado")
            ))
            .collect();

        const counts = {
            hoy: 0,
            ayer: 0,
            "7dias": 0,
            "30dias": 0,
        };

        const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
        const sevenDaysStart = todayStart - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysStart = todayStart - 30 * 24 * 60 * 60 * 1000;

        allOrders.forEach(order => {
            const time = order._creationTime;
            if (time >= todayStart) counts.hoy++;
            if (time >= yesterdayStart && time < todayStart) counts.ayer++;
            if (time >= sevenDaysStart) counts["7dias"]++;
            if (time >= thirtyDaysStart) counts["30dias"]++;
        });

        return counts;
    },
});

// Query para obtener el historial de una métrica específica agrupado por tiempo
export const getMetricHistory = query({
    args: {
        comercio_id: v.id("comercios"),
        filtro: v.union(v.literal("hoy"), v.literal("ayer"), v.literal("7dias"), v.literal("30dias")),
        metricName: v.string(),
    },
    handler: async (ctx, args) => {
        const now = new Date();
        const BOGOTA_OFFSET = -5 * 60 * 60 * 1000;
        const nowBogota = new Date(now.getTime() + BOGOTA_OFFSET);
        const todayStart = new Date(
            nowBogota.getUTCFullYear(),
            nowBogota.getUTCMonth(),
            nowBogota.getUTCDate()
        ).getTime() - BOGOTA_OFFSET;

        let startTime: number;
        let endTime: number = now.getTime();
        let step: number; // in milliseconds
        let periods: number;

        if (args.filtro === "hoy") {
            startTime = todayStart;
            step = 60 * 60 * 1000; // 1 hour
            periods = 24;
        } else if (args.filtro === "ayer") {
            startTime = todayStart - 24 * 60 * 60 * 1000;
            endTime = todayStart;
            step = 60 * 60 * 1000; // 1 hour
            periods = 24;
        } else if (args.filtro === "7dias") {
            startTime = todayStart - 6 * 24 * 60 * 60 * 1000;
            step = 24 * 60 * 60 * 1000; // 1 day
            periods = 7;
        } else if (args.filtro === "30dias") {
            startTime = todayStart - 29 * 24 * 60 * 60 * 1000;
            step = 24 * 60 * 60 * 1000; // 1 day
            periods = 30;
        } else {
            throw new Error("Filtro no soportado para historial");
        }

        const history = [];
        const buckets: number[] = Array(periods).fill(0);
        const bucketCounts: number[] = Array(periods).fill(0);

        if (args.metricName === "Conversión") {
            const messages = await ctx.db
                .query("mensajes")
                .filter((q) => q.and(
                    q.eq(q.field("comercio_id"), args.comercio_id),
                    q.gte(q.field("_creationTime"), startTime),
                    q.lt(q.field("_creationTime"), endTime)
                ))
                .collect();

            const orders = await ctx.db
                .query("pedidos")
                .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
                .filter((q) => q.and(
                    q.gte(q.field("_creationTime"), startTime),
                    q.lt(q.field("_creationTime"), endTime)
                ))
                .collect();

            const clientsInChats: Set<string>[] = Array.from({ length: periods }, () => new Set());
            const clientsWithOrders: Set<string>[] = Array.from({ length: periods }, () => new Set());

            messages.forEach(m => {
                const idx = Math.floor((m._creationTime - startTime) / step);
                if (idx >= 0 && idx < periods && m.cliente_id) {
                    clientsInChats[idx].add(m.cliente_id.toString());
                }
            });

            orders.forEach(p => {
                const idx = Math.floor((p._creationTime - startTime) / step);
                if (idx >= 0 && idx < periods && p.cliente_id) {
                    clientsWithOrders[idx].add(p.cliente_id.toString());
                }
            });

            for (let i = 0; i < periods; i++) {
                const val = clientsInChats[i].size > 0 ? (clientsWithOrders[i].size / clientsInChats[i].size) * 100 : 0;
                const bucketStart = startTime + i * step;
                const dateLabel = args.filtro === "hoy" || args.filtro === "ayer"
                    ? `${new Date(bucketStart + BOGOTA_OFFSET).getUTCHours()}:00`
                    : new Date(bucketStart + BOGOTA_OFFSET).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
                history.push({ date: dateLabel, value: Math.round(val * 100) / 100 });
            }
            return history;
        }

        let data: any[] = [];
        if (args.metricName === "Total de Ventas" || args.metricName === "Ticket Promedio" || args.metricName === "Pedidos Creados") {
            data = await ctx.db
                .query("pedidos")
                .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
                .filter((q) => q.and(
                    q.gte(q.field("_creationTime"), startTime),
                    q.lt(q.field("_creationTime"), endTime),
                    q.neq(q.field("estado"), "borrador"),
                    q.neq(q.field("estado"), "cancelado")
                ))
                .collect();
        } else if (args.metricName === "Nuevos Clientes") {
            data = await ctx.db
                .query("clientes")
                .withIndex("by_comercio_update", (q) => q.eq("comercio_id", args.comercio_id))
                .filter((q) => q.and(
                    q.gte(q.field("_creationTime"), startTime),
                    q.lt(q.field("_creationTime"), endTime)
                ))
                .collect();
        } else if (args.metricName === "Eficiencia iA") {
            data = await ctx.db
                .query("mensajes")
                .filter((q) => q.and(
                    q.eq(q.field("comercio_id"), args.comercio_id),
                    q.gte(q.field("_creationTime"), startTime),
                    q.lt(q.field("_creationTime"), endTime)
                ))
                .collect();
        }

        data.forEach(item => {
            const idx = Math.floor((item._creationTime - startTime) / step);
            if (idx >= 0 && idx < periods) {
                if (args.metricName === "Total de Ventas") {
                    buckets[idx] += (item.total || 0);
                } else if (args.metricName === "Ticket Promedio") {
                    buckets[idx] += (item.total || 0);
                    bucketCounts[idx]++;
                } else if (args.metricName === "Pedidos Creados" || args.metricName === "Nuevos Clientes") {
                    buckets[idx]++;
                } else if (args.metricName === "Eficiencia iA") {
                    bucketCounts[idx]++;
                    if (item.es_ia) buckets[idx]++;
                }
            }
        });

        for (let i = 0; i < periods; i++) {
            let val = buckets[i];
            if (args.metricName === "Ticket Promedio") {
                val = bucketCounts[i] > 0 ? buckets[i] / bucketCounts[i] : 0;
            } else if (args.metricName === "Eficiencia iA") {
                val = bucketCounts[i] > 0 ? (buckets[i] / bucketCounts[i]) * 100 : 0;
            }

            const bucketStart = startTime + i * step;
            const dateLabel = args.filtro === "hoy" || args.filtro === "ayer"
                ? `${new Date(bucketStart + BOGOTA_OFFSET).getUTCHours()}:00`
                : new Date(bucketStart + BOGOTA_OFFSET).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

            history.push({ date: dateLabel, value: Math.round(val * 100) / 100 });
        }

        return history;
    },
});
