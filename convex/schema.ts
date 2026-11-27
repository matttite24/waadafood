import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vMenu } from "./menuValidators";

export default defineSchema({
    stores: defineTable({
        ownerId: v.string(), // `sub` del token de Kinde
        slug: v.string(),
        name: v.string(),
        waNumber: v.string(),
        waVerified: v.boolean(),
        plan: v.union(v.literal("free"), v.literal("pro")),
        planUntil: v.optional(v.number()),
        draftMenu: vMenu,
        publishedMenu: v.optional(vMenu),
        publishedVersion: v.number(),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        category: v.optional(v.string()),
        directoryOptIn: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_owner", ["ownerId"])
        .index("by_wa", ["waNumber"]),

    menuVersions: defineTable({
        storeId: v.id("stores"),
        version: v.number(),
        menu: vMenu,
        publishedAt: v.number(),
    }).index("by_store", ["storeId"]),

    orders: defineTable({
        storeId: v.id("stores"),
        code: v.string(),
        sessionId: v.string(),
        items: v.array(v.any()),
        clientTotal: v.number(),
        serverTotal: v.number(),
        mismatch: v.boolean(),
        customerName: v.string(),
        mode: v.union(v.literal("domicilio"), v.literal("retiro")),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        accuracy: v.optional(v.number()),
        reference: v.optional(v.string()),
        payment: v.string(),
        cashAmount: v.optional(v.number()),
        status: v.union(
            v.literal("enviado"),
            v.literal("confirmado"),
            v.literal("entregado"),
            v.literal("cancelado"),
        ),
        src: v.optional(v.string()),
        monthKey: v.string(),
        monthSeq: v.number(),
        createdAt: v.number(),
    })
        .index("by_store_created", ["storeId", "createdAt"])
        .index("by_store_session_code", ["storeId", "sessionId", "code"]),

    counters: defineTable({
        storeId: v.id("stores"),
        monthKey: v.string(),
        orders: v.number(),
    }).index("by_store_month", ["storeId", "monthKey"]),

    dailyStats: defineTable({
        storeId: v.id("stores"),
        day: v.string(),
        orders: v.number(),
        revenue: v.number(),
        upsellOrders: v.number(),
        deliveryOrders: v.number(),
    }).index("by_store_day", ["storeId", "day"]),

    funnel: defineTable({
        storeId: v.id("stores"),
        day: v.string(),
        step: v.string(),
        count: v.number(),
    }).index("by_store_day_step", ["storeId", "day", "step"]),

    pushSubs: defineTable({
        storeId: v.id("stores"),
        endpoint: v.string(),
        keys: v.object({ p256dh: v.string(), auth: v.string() }),
        createdAt: v.number(),
    })
        .index("by_store", ["storeId"])
        .index("by_endpoint", ["endpoint"]),
});
