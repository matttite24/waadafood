import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByTelefono = query({
    args: { telefono: v.string(), commerceId: v.id("comercios") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("clientes")
            .withIndex("by_telefono", (q) =>
                q.eq("telefono", args.telefono).eq("comercio_id", args.commerceId)
            )
            .unique();
    },
});

export const getById = query({
    args: { id: v.id("clientes") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const listByComercio = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("clientes")
            .filter((q) => q.eq(q.field("comercio_id"), args.comercio_id))
            .collect();
    },
});

// Nueva query optimizada: obtiene clientes usando datos desnormalizados (O(1) vs O(N))
export const listByComercioWithLastMessage = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        const clientes = await ctx.db
            .query("clientes")
            .withIndex("by_comercio_update", (q) => q.eq("comercio_id", args.comercio_id))
            .order("desc")
            .collect();

        return clientes.map(cliente => ({
            ...cliente,
            ultimoMensaje: cliente.ultimo_mensaje_fecha ? {
                _id: cliente._id, // Placeholder ID since we don't fetch the real msg header
                _creationTime: new Date(cliente.ultimo_mensaje_fecha).getTime(),
                contenido: cliente.ultimo_mensaje_contenido || "...",
                es_ia: cliente.ultimo_mensaje_es_ia || false,
                es_dueno: cliente.ultimo_mensaje_es_dueno || false,
            } : null,
            etiquetas_ids: cliente.etiquetas_ids || []
        }));
    },
});

export const create = mutation({
    args: {
        comercio_id: v.id("comercios"),
        telefono: v.string(),
        nombre_usuario: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("clientes", {
            comercio_id: args.comercio_id,
            telefono: args.telefono,
            nombre_usuario: args.nombre_usuario,
            asistente_activo: true,
            requiere_atencion_humana: false,
            archivado: false,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("clientes"),
        updates: v.object({
            nombre_usuario: v.optional(v.string()),
            asistente_activo: v.optional(v.boolean()),
            requiere_atencion_humana: v.optional(v.boolean()),
            motivo_escalacion: v.optional(v.string()),
            pedido_actual: v.optional(v.any()),
            ultima_direccion: v.optional(v.string()),
            archivado: v.optional(v.boolean()),
            tiene_mensajes_sin_leer: v.optional(v.boolean()),
            etiquetas_ids: v.optional(v.array(v.id("etiquetas"))),
        }),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, args.updates);
    },
});

export const marcarComoLeido = mutation({
    args: { id: v.id("clientes") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { tiene_mensajes_sin_leer: false });
    },
});

export const remove = mutation({
    args: { id: v.id("clientes") },
    handler: async (ctx, args) => {
        // Primero eliminar todos los mensajes de este cliente
        const mensajes = await ctx.db
            .query("mensajes")
            .withIndex("by_cliente", (q) => q.eq("cliente_id", args.id))
            .collect();

        for (const msg of mensajes) {
            await ctx.db.delete(msg._id);
        }

        // Luego eliminar el cliente
        await ctx.db.delete(args.id);
    },
});

export const clearAllByComercio = mutation({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        // Obtener todos los clientes del comercio
        const clientes = await ctx.db
            .query("clientes")
            .filter((q) => q.eq(q.field("comercio_id"), args.comercio_id))
            .collect();

        let deletedClientes = 0;
        let deletedMensajes = 0;
        let deletedPedidos = 0;

        for (const cliente of clientes) {
            // Eliminar mensajes del cliente
            const mensajes = await ctx.db
                .query("mensajes")
                .withIndex("by_cliente", (q) => q.eq("cliente_id", cliente._id))
                .collect();

            for (const msg of mensajes) {
                await ctx.db.delete(msg._id);
                deletedMensajes++;
            }

            // Eliminar el cliente
            await ctx.db.delete(cliente._id);
            deletedClientes++;
        }

        // Eliminar todos los pedidos del comercio
        const pedidos = await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .collect();

        for (const pedido of pedidos) {
            await ctx.db.delete(pedido._id);
            deletedPedidos++;
        }

        return { deletedClientes, deletedMensajes, deletedPedidos };
    },
});

export const getClienteDetail = query({
    args: { cliente_id: v.id("clientes") },
    handler: async (ctx, args) => {
        // 1. Get client data
        const cliente = await ctx.db.get(args.cliente_id);
        if (!cliente) {
            throw new Error("Cliente no encontrado");
        }

        // 2. Get all orders for this client
        const orders = await ctx.db
            .query("pedidos")
            .withIndex("by_cliente", (q) => q.eq("cliente_id", args.cliente_id))
            .filter((q) => q.and(
                q.neq(q.field("estado"), "borrador"),
                q.neq(q.field("estado"), "cancelado")
            ))
            .order("desc")
            .collect();

        // 3. Get tags data
        const etiquetas = cliente.etiquetas_ids
            ? await Promise.all(
                cliente.etiquetas_ids.map(id => ctx.db.get(id))
            ).then(results => results.filter(tag => tag !== null))
            : [];

        // 4. Calculate metrics
        const totalOrders = orders.length;
        const totalValue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        return {
            cliente,
            etiquetas,
            metrics: {
                totalOrders,
                totalValue,
            },
            orders,
        };
    },
});
