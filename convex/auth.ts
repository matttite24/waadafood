import type { MutationCtx, QueryCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** Devuelve el `sub` de Kinde del usuario autenticado, o null. Nunca se acepta un userId del cliente. */
export async function getOwnerId(ctx: Ctx): Promise<string | null> {
    const identity = await ctx.auth.getUserIdentity();
    return identity?.subject ?? null;
}

export async function requireOwnerId(ctx: Ctx): Promise<string> {
    const id = await getOwnerId(ctx);
    if (!id) throw new Error("No autenticado");
    return id;
}

export function isAdmin(ownerId: string): boolean {
    return (process.env.ADMIN_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean).includes(ownerId);
}
