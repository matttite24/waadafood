import { layout } from "./render";
import { RESERVED_SLUGS, SLUG_RE } from "../../shared/limits";
import type { Menu } from "../../shared/types";

interface Env {
    CONVEX_SITE_URL: string;
    INGEST_KEY: string;
}

const MENU_TTL = 300; // segundos (spec §7)

// `caches.default` existe en Workers pero no está en los tipos estándar de DOM.
const edgeCache = () => (caches as unknown as { default: Cache }).default;

const html = (body: string, status = 200) =>
    new Response(body, {
        status,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
            "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'self'",
        },
    });

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname === "/health") return new Response("ok");

        const slug = url.pathname.slice(1);
        if (request.method !== "GET" || !SLUG_RE.test(slug) || (RESERVED_SLUGS as readonly string[]).includes(slug)) {
            return html("<h1>No encontrado</h1>", 404);
        }

        const key = new Request(`https://cache.local/menu/${slug}`);
        let res = await edgeCache().match(key);
        if (!res) {
            res = await fetch(`${env.CONVEX_SITE_URL}/menu?slug=${slug}`, { headers: { "x-waada-key": env.INGEST_KEY } });
            if (!res.ok) return html("<h1>No encontrado</h1>", 404);
            res = new Response(res.body, res);
            res.headers.set("Cache-Control", `public, max-age=${MENU_TTL}`);
            ctx.waitUntil(edgeCache().put(key, res.clone()));
        }
        const menu = (await res.json()) as Menu;
        return html(layout(menu));
    },
};
