import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const list = query({
    args: { cliente_id: v.id("clientes") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("mensajes")
            .withIndex("by_cliente", (q) => q.eq("cliente_id", args.cliente_id))
            .order("asc")
            .collect();
    },
});

export const send = mutation({
    args: {
        comercio_id: v.id("comercios"),
        cliente_id: v.id("clientes"),
        contenido: v.string(),
        es_ia: v.boolean(),
        es_dueno: v.boolean(),
        imagenes: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert("mensajes", {
            comercio_id: args.comercio_id,
            cliente_id: args.cliente_id,
            contenido: args.contenido,
            es_ia: args.es_ia,
            es_dueno: args.es_dueno,
            imagenes: args.imagenes,
        });

        // Trigger AI if message is from user
        if (!args.es_ia && !args.es_dueno) {
            await ctx.scheduler.runAfter(0, api.chat.answer, {
                comercio_id: args.comercio_id,
                cliente_id: args.cliente_id,
                mensaje: args.contenido,
            });
        }

        // Update client with last message info (Denormalization)
        await ctx.db.patch(args.cliente_id, {
            ultimo_mensaje_contenido: args.imagenes && args.imagenes.length > 0 ? '📷 Imagen' : args.contenido,
            ultimo_mensaje_fecha: new Date().toISOString(), // Use ISO string to match schema
            ultimo_mensaje_es_ia: args.es_ia,
            ultimo_mensaje_es_dueno: args.es_dueno,
            tiene_mensajes_sin_leer: !args.es_ia && !args.es_dueno, // Only client messages mark as unread for owner
        });

        return messageId;
    },
});

export const getLastMessageByCliente = query({
    args: { cliente_id: v.id("clientes") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("mensajes")
            .withIndex("by_cliente", (q) => q.eq("cliente_id", args.cliente_id))
            .order("desc")
            .take(1);

        return messages[0] || null;
    },
});
