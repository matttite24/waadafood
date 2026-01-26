export const ESTADOS_PEDIDO = {
    PENDIENTE: "pendiente",
    CONFIRMADO: "confirmado",
    EN_PREPARACION: "en_preparacion",
    LISTO: "listo",
    ENTREGADO: "entregado",
    CANCELADO: "cancelado",
} as const;

export const CATEGORIAS_PRODUCTO = [
    "Combos",
    "Entradas",
    "Principales",
    "Bebidas",
    "Postres",
] as const;

export const ESTADOS_PEDIDO_LABELS: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    en_preparacion: "En Preparación",
    listo: "Listo",
    entregado: "Entregado",
    cancelado: "Cancelado",
};
