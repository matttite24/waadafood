import { v } from "convex/values";

// Spec §5.1. Los límites de cantidad (§5.2) se comprueban en `assertMenuLimits`.
const vOption = v.object({ id: v.string(), label: v.string(), price: v.number() });

const vGroup = v.object({
    id: v.string(),
    title: v.string(),
    type: v.union(v.literal("one"), v.literal("many")),
    prefix: v.optional(v.string()),
    max: v.optional(v.number()),
    options: v.array(vOption),
});

const vVariant = v.object({
    id: v.string(),
    label: v.string(),
    note: v.optional(v.string()),
    price: v.number(),
});

const vImage = v.object({
    key: v.string(),
    widths: v.array(v.number()),
    lqip: v.string(),
    w: v.number(),
    h: v.number(),
});

const vProduct = v.object({
    id: v.string(),
    name: v.string(),
    tag: v.optional(v.string()),
    desc: v.string(),
    color: v.string(),
    image: v.optional(vImage),
    variants: v.array(vVariant),
    groups: v.array(vGroup),
    upsell: v.boolean(),
    available: v.boolean(),
});

const vUpsell = v.object({ id: v.string(), label: v.string(), note: v.string(), price: v.number() });

const vDay = v.object({ open: v.string(), close: v.string() }); // "HH:MM"

export const vMenu = v.object({
    version: v.number(),
    store: v.object({
        slug: v.string(),
        name: v.string(),
        phone: v.string(),
        currency: v.literal("$"),
        color: v.string(),
        hours: v.optional(v.array(v.union(vDay, v.null()))), // 7 días, lunes=0; null = cerrado
        delivery: v.object({
            enabled: v.boolean(),
            pickup: v.boolean(),
            fee: v.optional(v.number()),
            note: v.optional(v.string()),
        }),
        payments: v.array(v.union(v.literal("efectivo"), v.literal("transferencia"))),
    }),
    products: v.array(vProduct),
    upsells: v.array(vUpsell),
});
