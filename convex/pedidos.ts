import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .order("desc")
            .collect();
    },
});

export const update = mutation({
    args: {
        id: v.id("pedidos"),
        estado: v.optional(v.string()),
        total: v.optional(v.number()),
        resumen_pedido: v.optional(v.any()),
        detalles: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const existing = await ctx.db.get(id);
        if (!existing) throw new Error("Pedido no encontrado");

        // Regla: Solo se puede modificar el contenido si está "pendiente"
        const intentandoModificarContenido = updates.total !== undefined || updates.resumen_pedido !== undefined || updates.detalles !== undefined;
        if (intentandoModificarContenido && existing.estado !== "pendiente") {
            throw new Error(`No se puede modificar un pedido en estado "${existing.estado}". Solo se permiten cambios en estado "pendiente".`);
        }

        await ctx.db.patch(id, updates);
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("pedidos"),
        estado: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { estado: args.estado });
    },
});

export const remove = mutation({
    args: { id: v.id("pedidos") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const create = mutation({
    args: {
        comercio_id: v.id("comercios"),
        cliente_id: v.optional(v.id("clientes")),
        estado: v.string(),
        total: v.number(),
        resumen_pedido: v.optional(v.any()),
        detalles: v.optional(v.any()),
        cliente_nombre: v.optional(v.string()),
        cliente_telefono: v.optional(v.string()),
        direccion_entrega: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("pedidos", args);
    },
});

export const getActiveOrdersByCliente = query({
    args: { cliente_id: v.id("clientes") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pedidos")
            .withIndex("by_cliente", (q) => q.eq("cliente_id", args.cliente_id))
            .filter((q) =>
                q.or(
                    q.eq(q.field("estado"), "pendiente"),
                    q.eq(q.field("estado"), "preparado")
                )
            )
            .collect();
    },
});

export const getBorrador = query({
    args: {
        comercio_id: v.id("comercios"),
        cliente_id: v.id("clientes"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pedidos")
            .withIndex("by_cliente", (q) => q.eq("cliente_id", args.cliente_id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("comercio_id"), args.comercio_id),
                    q.eq(q.field("estado"), "borrador")
                )
            )
            .first();
    },
});

export const upsertBorrador = mutation({
    args: {
        comercio_id: v.id("comercios"),
        cliente_id: v.id("clientes"),
        items: v.any(),
        total: v.number(),
        direccion: v.optional(v.string()),
        tipo_entrega: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Buscar borrador existente
        const existing = await ctx.db
            .query("pedidos")
            .withIndex("by_cliente", (q) => q.eq("cliente_id", args.cliente_id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("comercio_id"), args.comercio_id),
                    q.eq(q.field("estado"), "borrador")
                )
            )
            .first();

        const resumen = args.items.map((i: any) => `${i.cantidad || 1}x ${i.nombre}`).join(", ");

        if (existing) {
            await ctx.db.patch(existing._id, {
                total: args.total,
                detalles: args.items,
                resumen_pedido: resumen,
                direccion_entrega: args.direccion,
                // Podríamos guardar tipo_entrega en un campo nuevo si quisiéramos, pero por ahora en detalles o implícito en dirección
            });
            return existing._id;
        } else {
            return await ctx.db.insert("pedidos", {
                comercio_id: args.comercio_id,
                cliente_id: args.cliente_id,
                estado: "borrador",
                total: args.total,
                detalles: args.items,
                resumen_pedido: resumen,
                direccion_entrega: args.direccion || "",
                cliente_telefono: "", // Se llenará al confirmar o con datos del cliente si disponibles
                cliente_nombre: "",
            });
        }
    },
});

export const confirmarPedido = mutation({
    args: {
        pedidos_id: v.id("pedidos"),
        cliente_nombre: v.string(),
        cliente_telefono: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.pedidos_id, {
            estado: "pendiente",
            cliente_nombre: args.cliente_nombre,
            cliente_telefono: args.cliente_telefono,
        });
    },
});
