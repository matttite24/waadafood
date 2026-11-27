import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { getOwnerId, requireOwnerId } from "./auth";
import { LIMITS, RESERVED_SLUGS, SLUG_RE } from "../shared/limits";
import { vMenu } from "./menuValidators";

type Menu = Doc<"stores">["draftMenu"];

function slugify(name: string): string {
    const base = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 36);
    return base.length >= 2 ? base : "local";
}

async function uniqueSlug(ctx: MutationCtx, name: string): Promise<string> {
    const base = slugify(name);
    for (let i = 0; i < 50; i++) {
        const candidate = i === 0 ? base : `${base}-${i + 1}`;
        if ((RESERVED_SLUGS as readonly string[]).includes(candidate) || !SLUG_RE.test(candidate)) continue;
        const taken = await ctx.db.query("stores").withIndex("by_slug", (q) => q.eq("slug", candidate)).first();
        if (!taken) return candidate;
    }
    throw new Error("No se pudo generar un enlace único");
}

function sampleMenu(slug: string, name: string, phone: string): Menu {
    return {
        version: 0,
        store: {
            slug,
            name,
            phone,
            currency: "$",
            color: "#C8321F",
            delivery: { enabled: true, pickup: true },
            payments: ["efectivo"],
        },
        products: [
            {
                id: "producto-1",
                name: "Mi primer producto",
                desc: "Edita este producto desde el panel.",
                color: "#F4C542",
                variants: [{ id: "unico", label: "Único", price: 5 }],
                groups: [],
                upsell: false,
                available: true,
            },
        ],
        upsells: [],
    };
}

export function assertMenuLimits(menu: Menu) {
    const L = LIMITS;
    if (menu.products.length < L.products.min || menu.products.length > L.products.max)
        throw new Error(`Debe haber entre ${L.products.min} y ${L.products.max} productos`);
    if (menu.upsells.length > L.upsells.max) throw new Error(`Máximo ${L.upsells.max} extras de combo`);
    for (const p of menu.products) {
        if (!p.name.trim() || p.name.length > L.productNameMax) throw new Error(`Nombre de producto inválido: máx. ${L.productNameMax} caracteres`);
        if (p.desc.length > L.descMax) throw new Error(`Descripción demasiado larga: máx. ${L.descMax} caracteres`);
        if (p.variants.length < L.variants.min || p.variants.length > L.variants.max) throw new Error(`Cada producto necesita entre ${L.variants.min} y ${L.variants.max} variantes`);
        if (p.groups.length > L.groupsPerProduct.max) throw new Error(`Máximo ${L.groupsPerProduct.max} grupos por producto`);
        for (const g of p.groups) {
            if (g.options.length < L.optionsPerGroup.min || g.options.length > L.optionsPerGroup.max) throw new Error(`Cada grupo necesita entre ${L.optionsPerGroup.min} y ${L.optionsPerGroup.max} opciones`);
        }
        for (const price of [...p.variants.map((x) => x.price), ...p.groups.flatMap((g) => g.options.map((o) => o.price))]) {
            if (!(price >= 0) || price > 10000) throw new Error("Precio inválido");
        }
    }
}

/** Comercio del usuario autenticado (null si no hay sesión o aún no se registró). */
export const getMine = query({
    args: {},
    handler: async (ctx) => {
        const ownerId = await getOwnerId(ctx);
        if (!ownerId) return null;
        return await ctx.db.query("stores").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).first();
    },
});

/** Registro: devuelve el comercio del usuario o lo crea con un menú de ejemplo. Un usuario = un comercio. */
export const getOrCreateMine = mutation({
    args: { name: v.string(), waNumber: v.string(), category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const ownerId = await requireOwnerId(ctx);
        const existing = await ctx.db.query("stores").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).first();
        if (existing) return existing._id;

        const name = args.name.trim();
        if (name.length < 2 || name.length > 60) throw new Error("Nombre inválido");
        const waNumber = args.waNumber.replace(/\D/g, "");
        if (waNumber.length < 8 || waNumber.length > 15) throw new Error("Número de WhatsApp inválido (con código de país, sin +)");
        const waTaken = await ctx.db.query("stores").withIndex("by_wa", (q) => q.eq("waNumber", waNumber)).first();
        if (waTaken) throw new Error("Ese número de WhatsApp ya tiene una cuenta");

        const slug = await uniqueSlug(ctx, name);
        return await ctx.db.insert("stores", {
            ownerId,
            slug,
            name,
            waNumber,
            waVerified: false,
            plan: "free",
            draftMenu: sampleMenu(slug, name, waNumber),
            publishedVersion: 0,
            category: args.category?.trim() || undefined,
            directoryOptIn: false,
            createdAt: Date.now(),
        });
    },
});

/** Guarda el borrador. El slug y el teléfono no se cambian desde aquí. */
export const saveDraft = mutation({
    args: { menu: vMenu },
    handler: async (ctx, { menu }) => {
        const ownerId = await requireOwnerId(ctx);
        const store = await ctx.db.query("stores").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).first();
        if (!store) throw new Error("Comercio no encontrado");
        assertMenuLimits(menu);
        await ctx.db.patch(store._id, {
            draftMenu: { ...menu, store: { ...menu.store, slug: store.slug, phone: store.waNumber } },
        });
    },
});
