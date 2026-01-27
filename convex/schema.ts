import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    comercios: defineTable({
        auth_user_id: v.string(), // Link to external user (Kinde/Clerk/any auth provider)
        nombre_comercio: v.string(),
        prompt_personalidad: v.optional(v.string()),
        instrucciones_pago: v.optional(v.string()),
        descripcion_corta: v.optional(v.string()),
        direccion: v.optional(v.string()),
        google_maps_link: v.optional(v.string()),
        ciudad: v.optional(v.string()),
        horario_atencion: v.optional(v.string()),
        telefono_contacto: v.optional(v.string()),
        nombre_asistente: v.optional(v.string()),
        directrices_comunicacion: v.optional(v.string()),
        imagenes_menu: v.optional(v.array(v.string())),
        ia_activa: v.optional(v.boolean()),
        pago_efectivo: v.optional(v.boolean()),
        pago_transferencia: v.optional(v.boolean()),
        tiempos_preparacion: v.optional(v.string()),
        tiempo_limite_cierre: v.optional(v.number()),
        reglas_escalacion: v.optional(v.string()),
        creditos: v.optional(v.number()),
        ia_estilo: v.optional(v.string()), // "amigable", "profesional", "relajado"
    }).index("by_user", ["auth_user_id"]),

    clientes: defineTable({
        comercio_id: v.id("comercios"),
        telefono: v.string(),
        nombre_usuario: v.optional(v.string()),
        asistente_activo: v.boolean(), // asistente_activo en Supabase
        requiere_atencion_humana: v.boolean(),
        motivo_escalacion: v.optional(v.string()),
        pedido_actual: v.optional(v.any()), // JSON en Supabase

        // Denormalized fields for list performance
        ultimo_mensaje_contenido: v.optional(v.string()),
        ultimo_mensaje_fecha: v.optional(v.string()),
        ultimo_mensaje_es_ia: v.optional(v.boolean()),
        ultimo_mensaje_es_dueno: v.optional(v.boolean()),
        ultima_direccion: v.optional(v.string()),
        archivado: v.optional(v.boolean()),
        tiene_mensajes_sin_leer: v.optional(v.boolean()),
        etiquetas_ids: v.optional(v.array(v.id("etiquetas"))),
    }).index("by_telefono", ["telefono", "comercio_id"])
        .index("by_comercio_update", ["comercio_id", "ultimo_mensaje_fecha"])
        .index("by_comercio", ["comercio_id"]),

    mensajes: defineTable({
        comercio_id: v.id("comercios"),
        cliente_id: v.id("clientes"),
        contenido: v.string(),
        es_ia: v.boolean(),
        es_dueno: v.boolean(),
        imagenes: v.optional(v.array(v.string())),
    }).index("by_cliente", ["cliente_id"])
        .index("by_comercio", ["comercio_id"]),

    productos: defineTable({
        comercio_id: v.id("comercios"),
        nombre: v.string(),
        descripcion: v.optional(v.string()),
        precio: v.number(),
        categoria: v.string(),
        imagen_url: v.optional(v.string()),
        disponible: v.boolean(),
    }).index("by_comercio", ["comercio_id"]),

    pedidos: defineTable({
        comercio_id: v.id("comercios"),
        cliente_id: v.optional(v.id("clientes")),
        estado: v.string(), // "pendiente", "preparado", "entregado", "cancelado", "borrador"
        total: v.number(),
        resumen_pedido: v.optional(v.any()),
        detalles: v.optional(v.any()),
        cliente_nombre: v.optional(v.string()),
        cliente_telefono: v.optional(v.string()),
        direccion_entrega: v.optional(v.string()),
    }).index("by_comercio", ["comercio_id"])
        .index("by_cliente", ["cliente_id"]),

    plantillas: defineTable({
        comercio_id: v.id("comercios"),
        nombre: v.string(), // El atajo, ej: "saludo"
        contenido: v.string(), // El mensaje completo
    }).index("by_comercio", ["comercio_id"]),

    etiquetas: defineTable({
        comercio_id: v.id("comercios"),
        nombre: v.string(),
        color: v.string(), // Hex color
    }).index("by_comercio", ["comercio_id"]),
});
