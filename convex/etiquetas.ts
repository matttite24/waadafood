import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByComercio = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("etiquetas")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .collect();
    },
});

export const create = mutation({
    args: {
        comercio_id: v.id("comercios"),
        nombre: v.string(),
        color: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("etiquetas", {
            comercio_id: args.comercio_id,
            nombre: args.nombre,
            color: args.color,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("etiquetas"),
        nombre: v.optional(v.string()),
        color: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("etiquetas") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);

        // Opcional: Limpiar referencias de esta etiqueta en los clientes
    },
});

export const aplicarEtiquetas = mutation({
    args: {
        cliente_id: v.id("clientes"),
        etiquetas_ids: v.array(v.id("etiquetas")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.cliente_id, {
            etiquetas_ids: args.etiquetas_ids,
        });
    },
});
