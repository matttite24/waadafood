import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Paginated query for chat list - optimized for large datasets
export const listPaginated = query({
    args: {
        comercio_id: v.id("comercios"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const results = await ctx.db
            .query("clientes")
            .withIndex("by_comercio", (q) =>
                q.eq("comercio_id", args.comercio_id)
            )
            .order("desc") // Most recent first
            .paginate(args.paginationOpts);

        // Map results to include denormalized last message data
        const mappedResults = results.page.map(cliente => ({
            ...cliente,
            ultimoMensaje: cliente.ultimo_mensaje_fecha ? {
                _id: cliente._id,
                _creationTime: new Date(cliente.ultimo_mensaje_fecha).getTime(),
                contenido: cliente.ultimo_mensaje_contenido || "...",
                es_ia: cliente.ultimo_mensaje_es_ia || false,
                es_dueno: cliente.ultimo_mensaje_es_dueno || false,
            } : null,
            etiquetas_ids: cliente.etiquetas_ids || []
        }));

        return {
            ...results,
            page: mappedResults
        };
    },
});
