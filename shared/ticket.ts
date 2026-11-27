// Ticket firmado para subir una foto (spec §10): base64url(json).base64url(HMAC-SHA256).
// Lo firma Convex (acción) y lo verifica el Worker; ambos usan Web Crypto, sin dependencias.

export interface UploadTicket {
    storeId: string;
    file: string; // "{hash}-{w}.{ext}"
    exp: number; // ms
}

export const FILE_RE = /^[a-f0-9]{10}-(480|720|1080)\.webp$/;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string): Uint8Array<ArrayBuffer> {
    const pad = "=".repeat((4 - (s.length % 4)) % 4);
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const key = (secret: string, usage: "sign" | "verify") =>
    crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);

export async function signTicket(t: UploadTicket, secret: string): Promise<string> {
    const body = b64url(enc.encode(JSON.stringify(t)));
    const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(secret, "sign"), enc.encode(body)));
    return `${body}.${b64url(sig)}`;
}

/** Devuelve el contenido del ticket si la firma es válida y no venció; null en otro caso. */
export async function verifyTicket(token: string, secret: string, now = Date.now()): Promise<UploadTicket | null> {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    try {
        const ok = await crypto.subtle.verify("HMAC", await key(secret, "verify"), unb64url(sig), enc.encode(body));
        if (!ok) return null;
        const t = JSON.parse(new TextDecoder().decode(unb64url(body))) as UploadTicket;
        if (typeof t.storeId !== "string" || typeof t.file !== "string" || typeof t.exp !== "number" || t.exp < now) return null;
        return t;
    } catch {
        return null;
    }
}
