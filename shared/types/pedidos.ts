import { Id } from "../../convex/_generated/dataModel";

export type EstadoPedido = "pendiente" | "confirmado" | "en_preparacion" | "listo" | "entregado" | "cancelado";

export type PedidoItem = {
    productoId: Id<"productos">;
    nombre: string;
    cantidad: number;
    precio: number;
    notas?: string;
};

export type Pedido = {
    _id: Id<"pedidos">;
    comercioId: Id<"comercios">;
    clienteId: Id<"clientes">;
    items: PedidoItem[];
    total: number;
    estado: EstadoPedido;
    notas?: string;
    direccion?: string;
    telefono?: string;
    createdAt: number;
    updatedAt: number;
};
