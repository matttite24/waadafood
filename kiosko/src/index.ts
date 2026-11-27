import { layout } from "./render";
import { RESERVED_SLUGS, SLUG_RE, LIMITS } from "../../shared/limits";
import { FILE_RE, verifyTicket } from "../../shared/ticket";
import type { Menu } from "../../shared/types";

interface Env {
    CONVEX_SITE_URL: string;
    INGEST_KEY: string;
    /** Origen del panel que puede incrustar la vista previa. Por defecto, producción. */
    PANEL_ORIGIN?: string;
    IMAGES: R2Bucket;
    UPLOAD_SECRET: string;
    ASSETS: Fetcher;
}

const MENU_TTL = 300; // segundos (spec §7)
const PREVIEW_MAX_BYTES = 100 * 1024;
const MAX_ORDER_BYTES = 8 * 1024;

// `caches.default` existe en Workers pero no está en los tipos estándar de DOM.
const edgeCache = () => (caches as unknown as { default: Cache }).default;

function html(body: string, opts: { status?: number; frameAncestors?: string; noStore?: boolean } = {}) {
    return new Response(body, {
        status: opts.status ?? 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": opts.noStore ? "no-store" : "no-cache",
            "Content-Security-Policy":
                "default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'self'; " +
                `frame-ancestors ${opts.frameAncestors ?? "'none'"}`,
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        },
    });
}

const notFound = () => html("<!DOCTYPE html><meta charset=utf-8><title>No encontrado</title><h1>No encontrado</h1>", { status: 404 });

/** Comprobación mínima de forma para la vista previa (el contenido igual se escapa al renderizar). */
function looksLikeMenu(m: unknown): m is Menu {
    const x = m as Menu | null;
    return !!x && typeof x === "object" && !!x.store && typeof x.store.name === "string" &&
        Array.isArray(x.products) && x.products.length > 0 && x.products.length <= 5 &&
        x.products.every((p) => p && typeof p.name === "string" && typeof p.id === "string" && Array.isArray(p.variants) && p.variants.length > 0 &&
            p.variants.every((v) => typeof v.price === "number"));
}

const STORE_ID_RE = /^[a-z0-9]{20,40}$/;

function cors(env: Env): Record<string, string> {
    return {
        "Access-Control-Allow-Origin": env.PANEL_ORIGIN ?? "https://app.waadafood.com",
        "Access-Control-Allow-Methods": "PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
    };
}

const json = (status: number, body: string, env: Env) => new Response(body, { status, headers: cors(env) });

/** PUT /api/imagen/:storeId/:file: exige un ticket firmado que coincida con la ruta (spec §10). */
async function uploadImage(request: Request, env: Env, storeId: string, file: string): Promise<Response> {
    const token = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
    const ticket = await verifyTicket(token, env.UPLOAD_SECRET);
    if (!ticket || ticket.storeId !== storeId || ticket.file !== file) return json(403, "Ticket inválido o vencido", env);
    if (request.headers.get("Content-Type") !== "image/webp") return json(415, "Solo image/webp", env);
    const declared = Number(request.headers.get("Content-Length") ?? 0);
    if (declared > LIMITS.uploadedVariantMaxBytes) return json(413, "Archivo muy grande", env);
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > LIMITS.uploadedVariantMaxBytes) return json(413, "Archivo muy grande", env);
    await env.IMAGES.put(`${storeId}/${file}`, bytes, { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" } });
    return json(204, "", env);
}

/** GET /i/:storeId/:file: los nombres llevan hash, así que nunca cambian de contenido (caché eterna). */
async function serveImage(env: Env, storeId: string, file: string): Promise<Response> {
    const obj = await env.IMAGES.get(`${storeId}/${file}`);
    if (!obj) return new Response("No encontrado", { status: 404 });
    return new Response(obj.body, {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        },
    });
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname === "/health") return new Response("ok");

        if (url.pathname.startsWith("/assets/")) {
            const res = await env.ASSETS.fetch(request);
            if (!res.ok) return res;
            const out = new Response(res.body, res);
            out.headers.set("Cache-Control", "public, max-age=31536000, immutable"); // el nombre lleva hash
            return out;
        }

        // Aviso de pedido desde el kiosko (sendBeacon): se reenvía a Convex sin hacer esperar al cliente.
        if (url.pathname === "/api/pedido") {
            if (request.method !== "POST") return new Response("Método no permitido", { status: 405 });
            const body = await request.text();
            if (body.length === 0 || body.length > MAX_ORDER_BYTES) return new Response(null, { status: 413 });
            ctx.waitUntil(
                fetch(`${env.CONVEX_SITE_URL}/pedido`, {
                    method: "POST",
                    headers: { "x-waada-key": env.INGEST_KEY, "Content-Type": "application/json", "x-client-ip": request.headers.get("cf-connecting-ip") ?? "" },
                    body,
                })
                    .then(async (r) => { if (!r.ok) console.error("pedido rechazado por Convex", r.status, await r.text()); })
                    .catch((e) => console.error("pedido: no se pudo contactar a Convex", String(e))),
            );
            return new Response(null, { status: 204 });
        }

        const img = url.pathname.match(/^\/(api\/imagen|i)\/([a-z0-9]+)\/([a-f0-9-]+\.webp)$/);
        if (img) {
            const [, kind, storeId, file] = img;
            if (!STORE_ID_RE.test(storeId) || !FILE_RE.test(file)) return new Response("No encontrado", { status: 404 });
            if (kind === "i") return request.method === "GET" ? serveImage(env, storeId, file) : new Response("No encontrado", { status: 404 });
            if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(env) });
            if (request.method === "PUT") return uploadImage(request, env, storeId, file);
            return new Response("Método no permitido", { status: 405 });
        }

        const slug = url.pathname.slice(1);
        if (!SLUG_RE.test(slug) || (RESERVED_SLUGS as readonly string[]).includes(slug)) return notFound();

        // Vista previa: el panel envía el borrador por POST a un iframe. No se guarda ni se cachea nada.
        if (url.searchParams.get("preview") === "1") {
            if (request.method !== "POST") return notFound();
            const form = await request.formData();
            const raw = form.get("menu");
            if (typeof raw !== "string" || raw.length > PREVIEW_MAX_BYTES) return html("<h1>Borrador inválido</h1>", { status: 400, noStore: true });
            let menu: unknown;
            try { menu = JSON.parse(raw); } catch { return html("<h1>Borrador inválido</h1>", { status: 400, noStore: true }); }
            if (!looksLikeMenu(menu)) return html("<h1>Borrador inválido</h1>", { status: 400, noStore: true });
            return html(layout(menu, { selected: url.searchParams.get("p"), preview: true }), {
                frameAncestors: env.PANEL_ORIGIN ?? "https://app.waadafood.com",
                noStore: true,
            });
        }

        if (request.method !== "GET") return notFound();

        const key = new Request(`https://cache.local/menu/${slug}`);
        let res = await edgeCache().match(key);
        if (!res) {
            res = await fetch(`${env.CONVEX_SITE_URL}/menu?slug=${slug}`, { headers: { "x-waada-key": env.INGEST_KEY } });
            if (!res.ok) return notFound();
            res = new Response(res.body, res);
            res.headers.set("Cache-Control", `public, max-age=${MENU_TTL}`);
            ctx.waitUntil(edgeCache().put(key, res.clone()));
        }
        const menu = (await res.json()) as Menu;
        return html(layout(menu, { selected: url.searchParams.get("p") }));
    },
};
