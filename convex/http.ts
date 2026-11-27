import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/** Comparación en tiempo constante del secreto compartido con el Worker. */
function authorized(request: Request): boolean {
    const expected = process.env.INGEST_KEY;
    const got = request.headers.get("x-waada-key");
    if (!expected || !got || got.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
}

http.route({
    path: "/menu",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        if (!authorized(request)) return new Response("Forbidden", { status: 403 });
        const slug = new URL(request.url).searchParams.get("slug") ?? "";
        if (!/^[a-z0-9-]{2,40}$/.test(slug)) return new Response("Not found", { status: 404 });
        const menu = await ctx.runQuery(internal.stores.getPublishedBySlug, { slug });
        if (!menu) return new Response("Not found", { status: 404 });
        return new Response(JSON.stringify(menu), {
            headers: { "Content-Type": "application/json" },
        });
    }),
});

export default http;
