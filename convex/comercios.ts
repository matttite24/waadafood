import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const get = query({
    args: { id: v.id("comercios") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const update = mutation({
    args: {
        id: v.id("comercios"),
        updates: v.object({
            nombre_comercio: v.optional(v.string()),
            prompt_personalidad: v.optional(v.string()),
            instrucciones_pago: v.optional(v.string()),
            descripcion_corta: v.optional(v.string()),
            direccion: v.optional(v.string()),
            google_maps_link: v.optional(v.string()),
            ciudad: v.optional(v.string()),
            horario_atencion: v.optional(v.string()),
            telefono_contacto: v.optional(v.string()),
            nombre_asistente: v.optional(v.string()),
            directrices_comunicacion: v.optional(v.string()),
            imagenes_menu: v.optional(v.array(v.string())),
            ia_activa: v.optional(v.boolean()),
            pago_efectivo: v.optional(v.boolean()),
            pago_transferencia: v.optional(v.boolean()),
            tiempos_preparacion: v.optional(v.string()),
            tiempo_limite_cierre: v.optional(v.number()),
            reglas_escalacion: v.optional(v.string()),
            ia_estilo: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, args.updates);
    },
});

// Obtener comercio por userId de Clerk
export const getByUserId = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("comercios")
            .withIndex("by_user", (q) => q.eq("clerk_user_id", args.userId))
            .first();
    },
});

// Crear comercio completo con datos de onboarding
export const createWithOnboarding = mutation({
    args: {
        clerk_user_id: v.string(),
        nombre_comercio: v.string(),
        descripcion_corta: v.string(),
        ciudad: v.string(),
        direccion: v.string(),
        telefono_contacto: v.string(),
        horario_atencion: v.optional(v.string()),
        nombre_asistente: v.string(),
        prompt_personalidad: v.string(),
        directrices_comunicacion: v.optional(v.string()),
        instrucciones_pago: v.optional(v.string()),
        // Datos del primer producto
        producto_nombre: v.string(),
        producto_descripcion: v.string(),
        producto_precio: v.number(),
        producto_categoria: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Crear comercio
        const comercioId = await ctx.db.insert("comercios", {
            clerk_user_id: args.clerk_user_id,
            nombre_comercio: args.nombre_comercio,
            descripcion_corta: args.descripcion_corta,
            ciudad: args.ciudad,
            direccion: args.direccion,
            telefono_contacto: args.telefono_contacto,
            horario_atencion: args.horario_atencion,
            nombre_asistente: args.nombre_asistente,
            prompt_personalidad: args.prompt_personalidad,
            directrices_comunicacion: args.directrices_comunicacion,
            instrucciones_pago: args.instrucciones_pago,
            ia_activa: true,
            imagenes_menu: [],
            creditos: 20, // Créditos iniciales base
        });

        // 2. Crear primer producto
        await ctx.db.insert("productos", {
            comercio_id: comercioId,
            nombre: args.producto_nombre,
            descripcion: args.producto_descripcion,
            precio: args.producto_precio,
            categoria: args.producto_categoria,
            disponible: true,
        });

        return comercioId;
    },
});

// Mutación para consumir 1 crédito
export const consumirCredito = mutation({
    args: { id: v.id("comercios") },
    handler: async (ctx, args) => {
        const comercio = await ctx.db.get(args.id);
        if (!comercio) return;
        const currentCredits = comercio.creditos || 0;
        if (currentCredits > 0) {
            await ctx.db.patch(args.id, { creditos: currentCredits - 1 });
        }
    },
});

// Mutación para otorgar créditos (Gamificación / Recarga)
export const otorgarCreditos = mutation({
    args: { id: v.id("comercios"), cantidad: v.number() },
    handler: async (ctx, args) => {
        const comercio = await ctx.db.get(args.id);
        if (!comercio) return;
        const currentCredits = comercio.creditos || 0;
        await ctx.db.patch(args.id, { creditos: currentCredits + args.cantidad });
    },
});

// Para inicializar un comercio de prueba si no existe
export const create = mutation({
    args: {
        clerk_user_id: v.string(),
        nombre_comercio: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("comercios", {
            clerk_user_id: args.clerk_user_id,
            nombre_comercio: args.nombre_comercio,
            imagenes_menu: [],
            creditos: 10,
        });
    },
});
