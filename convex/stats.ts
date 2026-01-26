import { v } from "convex/values";
import { query } from "./_generated/server";

export const getNavbarBadgeCounts = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        // 1. Contar chats con mensajes no leídos del cliente o urgentes
        const unreadChats = await ctx.db
            .query("clientes")
            .filter((q) =>
                q.and(
                    q.eq(q.field("comercio_id"), args.comercio_id),
                    q.or(
                        q.eq(q.field("tiene_mensajes_sin_leer"), true),
                        q.eq(q.field("requiere_atencion_humana"), true)
                    )
                )
            )
            .collect();

        // 2. Contar pedidos pendientes
        const pendingOrders = await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .filter((q) => q.eq(q.field("estado"), "pendiente"))
            .collect();

        return {
            urgentChats: unreadChats.length,
            pendingOrders: pendingOrders.length,
        };
    },
});
