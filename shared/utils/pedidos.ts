import type { PedidoItem } from "../types/pedidos";

/**
 * Calcula el total de un pedido
 */
export function calcularTotalPedido(items: PedidoItem[]): number {
    return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

/**
 * Calcula el número total de items en un pedido
 */
export function contarItemsPedido(items: PedidoItem[]): number {
    return items.reduce((sum, item) => sum + item.cantidad, 0);
}
