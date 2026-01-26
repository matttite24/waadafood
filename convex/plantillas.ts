import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("plantillas")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .collect();
    },
});

export const create = mutation({
    args: {
        comercio_id: v.id("comercios"),
        nombre: v.string(),
        contenido: v.string(),
    },
    handler: async (ctx, args) => {
        // Validar que no exista un atajo con el mismo nombre (opcional, pero buena práctica)
        const existing = await ctx.db
            .query("plantillas")
            .withIndex("by_comercio", (q) => q.eq("comercio_id", args.comercio_id))
            .filter((q) => q.eq(q.field("nombre"), args.nombre))
            .first();

        if (existing) {
            throw new Error(`Ya existe una plantilla con el atajo "${args.nombre}"`);
        }

        return await ctx.db.insert("plantillas", {
            comercio_id: args.comercio_id,
            nombre: args.nombre,
            contenido: args.contenido,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("plantillas"),
        nombre: v.string(),
        contenido: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.id, {
            nombre: args.nombre,
            contenido: args.contenido,
        });
    },
});

export const remove = mutation({
    args: { id: v.id("plantillas") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
