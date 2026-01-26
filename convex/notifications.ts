import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Obtiene el resumen de notificaciones para un comercio
 * Retorna contadores de eventos que requieren atención
 */
export const getSummary = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        // 1. Contar chats que requieren atención humana (SOLO escalaciones, NO pedidos)
        const chatsUrgentesAll = await ctx.db
            .query("clientes")
            .filter(q =>
                q.and(
                    q.eq(q.field("comercio_id"), args.comercio_id),
                    q.eq(q.field("requiere_atencion_humana"), true)
                )
            )
            .collect();

        // Filtrar para excluir pedidos finalizados (solo escalaciones reales)
        const chatsUrgentes = chatsUrgentesAll.filter(
            c => c.motivo_escalacion !== "Pedido Finalizado"
        );

        // 2. Contar pedidos pendientes (ordenados por más reciente primero)
        const pedidosPendientes = await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", q => q.eq("comercio_id", args.comercio_id))
            .filter(q => q.eq(q.field("estado"), "pendiente"))
            .order("desc")
            .collect();

        // 3. Contar chats en modo manual (asistente desactivado) con último mensaje del cliente
        const chatsManuales = await ctx.db
            .query("clientes")
            .filter(q =>
                q.and(
                    q.eq(q.field("comercio_id"), args.comercio_id),
                    q.eq(q.field("asistente_activo"), false),
                    q.eq(q.field("archivado"), false)
                )
            )
            .collect();

        // Filtrar solo los que tienen último mensaje del cliente (no del dueño ni IA)
        const chatsManualesSinResponder = chatsManuales.filter(
            c => c.ultimo_mensaje_es_ia === false && c.ultimo_mensaje_es_dueno === false
        );

        return {
            chatsUrgentes: chatsUrgentes.length,
            pedidosPendientes: pedidosPendientes.length,
            chatsManualesSinResponder: chatsManualesSinResponder.length,
            totalNotificaciones: chatsUrgentes.length + pedidosPendientes.length,
            // Detalles para toasts
            ultimoChatUrgente: chatsUrgentes[0] ? {
                clienteNombre: chatsUrgentes[0].nombre_usuario || 'Cliente',
                motivo: chatsUrgentes[0].motivo_escalacion || 'Atención requerida',
                clienteId: chatsUrgentes[0]._id,
            } : null,
            ultimoPedidoPendiente: pedidosPendientes[0] ? {
                clienteNombre: pedidosPendientes[0].cliente_nombre || 'Cliente',
                total: pedidosPendientes[0].total,
                pedidoId: pedidosPendientes[0]._id,
            } : null,
            ultimoChatManual: chatsManualesSinResponder[0] ? {
                clienteNombre: chatsManualesSinResponder[0].nombre_usuario || 'Cliente',
                ultimoMensaje: chatsManualesSinResponder[0].ultimo_mensaje_contenido || 'Nuevo mensaje',
                clienteId: chatsManualesSinResponder[0]._id,
            } : null,
        };
    },
});

/**
 * Lista los chats que requieren atención humana
 */
export const listChatsUrgentes = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("clientes")
            .filter(q =>
                q.and(
                    q.eq(q.field("comercio_id"), args.comercio_id),
                    q.eq(q.field("requiere_atencion_humana"), true)
                )
            )
            .order("desc")
            .collect();
    },
});

export const listItems = query({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        // 1. Chats Urgentes (Escalaciones)
        const chatsUrgentes = await ctx.db
            .query("clientes")
            .withIndex("by_comercio_update", q => q.eq("comercio_id", args.comercio_id))
            .filter(q => q.eq(q.field("requiere_atencion_humana"), true))
            .collect();

        // 2. Pedidos Pendientes
        const pedidosPendientes = await ctx.db
            .query("pedidos")
            .withIndex("by_comercio", q => q.eq("comercio_id", args.comercio_id))
            .filter(q => q.eq(q.field("estado"), "pendiente"))
            .collect();

        // 3. Chats Manuales (esperando respuesta)
        const chatsManuales = await ctx.db
            .query("clientes")
            .withIndex("by_comercio_update", q => q.eq("comercio_id", args.comercio_id))
            .filter(q =>
                q.and(
                    q.eq(q.field("asistente_activo"), false),
                    q.eq(q.field("archivado"), false)
                )
            )
            .collect();

        const chatsManualesFiltrados = chatsManuales.filter(
            c => c.ultimo_mensaje_es_ia === false && c.ultimo_mensaje_es_dueno === false
        );

        // Normalize and Combine
        const notifications = [
            ...chatsUrgentes
                .filter(c => c.motivo_escalacion !== "Pedido Finalizado")
                .map(c => ({
                    type: "chat_urgente" as const,
                    id: c._id,
                    title: "Atención Requerida",
                    description: `Chat con ${c.nombre_usuario || c.telefono}: ${c.motivo_escalacion || 'Escalado por cliente'}`,
                    timestamp: c._creationTime, // Idealmente usar last_interaction si existe, fallback a creation
                    link: "/chats",
                    meta: { clienteId: c._id }
                })),
            ...pedidosPendientes.map(p => ({
                type: "pedido_pendiente" as const,
                id: p._id,
                title: "Nuevo Pedido",
                description: `Pedido de ${p.cliente_nombre || 'Cliente'} por $${p.total}`,
                timestamp: p._creationTime,
                link: "/pedidos",
                meta: { pedidoId: p._id }
            })),
            ...chatsManualesFiltrados.map(c => ({
                type: "chat_manual" as const,
                id: c._id,
                title: "Mensaje sin responder",
                description: `Chat manual con ${c.nombre_usuario || c.telefono}`,
                timestamp: c._creationTime,
                link: "/chats",
                meta: { clienteId: c._id }
            }))
        ];

        return notifications.sort((a, b) => b.timestamp - a.timestamp);
    },
});
