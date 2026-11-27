import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Activación manual de Pro (spec §12b: el cobro es manual en el MVP). Es interna: solo se puede llamar desde
 * la línea de comandos con acceso al despliegue, por ejemplo:
 *   pnpm exec convex run admin:setPlanBySlug '{"slug":"mi-local","plan":"pro","days":30}'
 *   pnpm exec convex run --prod admin:setPlanBySlug '{"slug":"mi-local","plan":"free"}'
 */
export const setPlanBySlug = internalMutation({
    args: { slug: v.string(), plan: v.union(v.literal("free"), v.literal("pro")), days: v.optional(v.number()) },
    handler: async (ctx, { slug, plan, days }) => {
        const store = await ctx.db.query("stores").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
        if (!store) throw new Error("Comercio no encontrado");
        await ctx.db.patch(store._id, { plan, planUntil: plan === "pro" && days ? Date.now() + days * 24 * 3600 * 1000 : undefined });
        return { slug, plan, planUntil: plan === "pro" && days ? Date.now() + days * 24 * 3600 * 1000 : null };
    },
});
