import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        const productos = await ctx.db
            .query("productos")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .collect();

        return await Promise.all(
            productos.map(async (p) => {
                if (p.imagen_url && !p.imagen_url.startsWith("http")) {
                    // Assume it's a storage ID
                    const url = await ctx.storage.getUrl(p.imagen_url);
                    return { ...p, imagen_url: url || p.imagen_url };
                }
                return p;
            })
        );
    },
});

export const create = mutation({
    args: {
        comercio_id: v.id("comercios"),
        nombre: v.string(),
        descripcion: v.optional(v.string()),
        precio: v.number(),
        categoria: v.string(),
        imagen_url: v.optional(v.string()),
        disponible: v.boolean(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("productos", {
            comercio_id: args.comercio_id,
            nombre: args.nombre,
            descripcion: args.descripcion,
            precio: args.precio,
            categoria: args.categoria,
            imagen_url: args.imagen_url,
            disponible: args.disponible,
        });
    },
});

export const get = query({
    args: { id: v.id("productos") },
    handler: async (ctx, args) => {
        const producto = await ctx.db.get(args.id);
        if (!producto) return null;

        if (producto.imagen_url && !producto.imagen_url.startsWith("http")) {
            const url = await ctx.storage.getUrl(producto.imagen_url);
            return { ...producto, imagen_url: url || producto.imagen_url };
        }
        return producto;
    },
});

export const update = mutation({
    args: {
        id: v.id("productos"),
        nombre: v.optional(v.string()),
        descripcion: v.optional(v.string()),
        precio: v.optional(v.number()),
        categoria: v.optional(v.string()),
        imagen_url: v.optional(v.string()), // Permite null para borrar
        disponible: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("productos") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
