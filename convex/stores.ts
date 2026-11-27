import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { getOwnerId, requireOwnerId } from "./auth";
import { LIMITS, RESERVED_SLUGS, SLUG_RE } from "../shared/limits";
import { normalizeWhatsApp } from "../shared/phone";
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
    const { delivery, payments, color } = menu.store;
    if (!delivery.enabled && !delivery.pickup) throw new Error("Activa al menos una forma de entrega");
    if (payments.length === 0) throw new Error("Activa al menos una forma de pago");
    if (delivery.fee !== undefined && !(delivery.fee >= 0 && delivery.fee <= 100)) throw new Error("Costo de envío inválido");
    if (delivery.note && delivery.note.length > 80) throw new Error("La nota de entrega es demasiado larga");
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("Color inválido");
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
        const waNumber = normalizeWhatsApp(args.waNumber);
        if (!waNumber) throw new Error("El número de WhatsApp no parece válido. Ejemplo: 0988200451");
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

const IMG_KEY_RE = /^[a-z0-9]+\/[a-f0-9]{10}$/;

/** La foto debe pertenecer al comercio (su clave empieza con su id) y tener la forma que genera el panel. */
function assertImages(menu: Menu, storeId: string) {
    for (const p of menu.products) {
        const img = p.image;
        if (!img) continue;
        if (!IMG_KEY_RE.test(img.key) || !img.key.startsWith(`${storeId}/`)) throw new Error("Foto inválida");
        if (!img.lqip.startsWith("data:image/webp;base64,") || img.lqip.length > 2000) throw new Error("Foto inválida");
        if (!(img.w > 0 && img.h > 0 && img.w <= 4000 && img.h <= 4000)) throw new Error("Foto inválida");
    }
}

/** Guarda el borrador. El slug y el teléfono no se cambian desde aquí. */
export const saveDraft = mutation({
    args: { menu: vMenu },
    handler: async (ctx, { menu }) => {
        const ownerId = await requireOwnerId(ctx);
        const store = await ctx.db.query("stores").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).first();
        if (!store) throw new Error("Comercio no encontrado");
        assertMenuLimits(menu);
        assertImages(menu, store._id);
        await ctx.db.patch(store._id, {
            draftMenu: { ...menu, store: { ...menu.store, slug: store.slug, phone: store.waNumber, name: store.name } },
        });
    },
});

/** Publica el borrador (reemplaza lo publicado; no hay historial) y lo deja visible para el kiosko (hasta 5 min por la caché). */
export const publish = mutation({
    args: {},
    handler: async (ctx) => {
        const ownerId = await requireOwnerId(ctx);
        const store = await ctx.db.query("stores").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).first();
        if (!store) throw new Error("Comercio no encontrado");
        assertMenuLimits(store.draftMenu);
        const version = store.publishedVersion + 1;
        const menu = { ...store.draftMenu, version };
        await ctx.db.patch(store._id, { publishedMenu: menu, publishedVersion: version });
        return version;
    },
});

/** Solo para las acciones HTTP del Worker. */
export const getPublishedBySlug = internalQuery({
    args: { slug: v.string() },
    handler: async (ctx, { slug }) => {
        const store = await ctx.db.query("stores").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
        return store?.publishedMenu ?? null;
    },
});

/** Cambia el nombre y la categoría del local. El enlace (slug) y el WhatsApp no se tocan desde aquí. */
export const updateProfile = mutation({
    args: { name: v.string(), category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const ownerId = await requireOwnerId(ctx);
        const store = await ctx.db.query("stores").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).first();
        if (!store) throw new Error("Comercio no encontrado");
        const name = args.name.trim();
        if (name.length < 2 || name.length > 60) throw new Error("El nombre debe tener entre 2 y 60 caracteres");
        const category = args.category?.trim().slice(0, 40) || undefined;
        await ctx.db.patch(store._id, { name, category, draftMenu: { ...store.draftMenu, store: { ...store.draftMenu.store, name } } });
    },
});
