import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { FILE_RE, signTicket } from "../shared/ticket";

const TICKET_TTL_MS = 10 * 60 * 1000;

/**
 * Entrega un ticket firmado (10 min) por cada archivo que el panel va a subir al Worker.
 * Es una acción y no una mutación porque firma con criptografía (spec §10).
 */
export const requestUploadTicket = action({
    args: { files: v.array(v.string()) },
    handler: async (ctx, { files }): Promise<{ storeId: string; tickets: Record<string, string> }> => {
        const store = await ctx.runQuery(api.stores.getMine, {});
        if (!store) throw new Error("No autenticado o sin comercio");
        if (files.length === 0 || files.length > 6) throw new Error("Cantidad de archivos inválida");
        const secret = process.env.UPLOAD_SECRET;
        if (!secret) throw new Error("UPLOAD_SECRET no configurado");

        const tickets: Record<string, string> = {};
        for (const file of files) {
            if (!FILE_RE.test(file)) throw new Error("Nombre de archivo inválido");
            tickets[file] = await signTicket({ storeId: store._id, file, exp: Date.now() + TICKET_TTL_MS }, secret);
        }
        return { storeId: store._id, tickets };
    },
});
