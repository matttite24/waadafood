// Procesa la foto en el navegador del comercio (spec §10): 3 tamaños WebP + miniatura LQIP.

export const WIDTHS = [1080, 720, 480] as const;
const MAX_ORIGINAL_BYTES = 12 * 1024 * 1024;
const MAX_VARIANT_BYTES = 400 * 1024;
const TARGET_720_BYTES = 80 * 1024;

export interface ProcessedPhoto {
    hash: string;
    w: number;
    h: number;
    lqip: string;
    /** nombre de archivo → contenido, ej. "ab12cd34ef-720.webp" */
    files: Record<string, Blob>;
}

async function encode(bitmap: ImageBitmap, width: number, quality: number): Promise<Blob> {
    const w = Math.min(width, bitmap.width); // no se agranda una foto chica
    const h = Math.round((bitmap.height * w) / bitmap.width);
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Tu navegador no puede procesar fotos");
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await canvas.convertToBlob({ type: "image/webp", quality });
    // Safari antiguo ignora WebP y devuelve PNG: mejor avisar que subir algo que el kiosko no entiende.
    if (blob.type !== "image/webp") throw new Error("Tu navegador no puede crear fotos WebP. Prueba con Chrome o actualiza Safari.");
    return blob;
}

async function encodeWithin(bitmap: ImageBitmap, width: number, max: number): Promise<Blob> {
    let blob = await encode(bitmap, width, 0.75);
    for (const q of [0.6, 0.5, 0.4]) {
        if (blob.size <= max) break;
        blob = await encode(bitmap, width, q);
    }
    if (blob.size > MAX_VARIANT_BYTES) throw new Error("La foto es demasiado pesada. Usa otra.");
    return blob;
}

const toDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(blob);
    });

export async function processPhoto(file: File): Promise<ProcessedPhoto> {
    if (!file.type.startsWith("image/")) throw new Error("Elige una imagen");
    if (file.size > MAX_ORIGINAL_BYTES) throw new Error("La foto pesa más de 12 MB");
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    try {
        const b1080 = await encodeWithin(bitmap, 1080, MAX_VARIANT_BYTES);
        const b720 = await encodeWithin(bitmap, 720, TARGET_720_BYTES);
        const b480 = await encodeWithin(bitmap, 480, TARGET_720_BYTES);
        const digest = await crypto.subtle.digest("SHA-256", await b1080.arrayBuffer());
        const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 10);
        const lqip = await toDataUrl(await encode(bitmap, 16, 0.4));
        return {
            hash,
            w: Math.min(1080, bitmap.width),
            h: Math.round((bitmap.height * Math.min(1080, bitmap.width)) / bitmap.width),
            lqip,
            files: { [`${hash}-1080.webp`]: b1080, [`${hash}-720.webp`]: b720, [`${hash}-480.webp`]: b480 },
        };
    } finally {
        bitmap.close();
    }
}

/** Sube cada variante al Worker con su ticket firmado. */
export async function uploadPhoto(
    kioskoUrl: string, storeId: string, photo: ProcessedPhoto, tickets: Record<string, string>,
): Promise<void> {
    for (const [name, blob] of Object.entries(photo.files)) {
        const res = await fetch(`${kioskoUrl}/api/imagen/${storeId}/${name}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${tickets[name]}`, "Content-Type": "image/webp" },
            body: blob,
        });
        if (!res.ok) throw new Error(`No se pudo subir la foto (${res.status})`);
    }
}
