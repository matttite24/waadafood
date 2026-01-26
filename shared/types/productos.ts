import { Id } from "../../convex/_generated/dataModel";

export type CategoriaProducto = "Combos" | "Entradas" | "Principales" | "Bebidas" | "Postres";

export type Producto = {
    _id: Id<"productos">;
    comercioId: Id<"comercios">;
    nombre: string;
    descripcion?: string;
    precio: number;
    categoria: CategoriaProducto;
    disponible: boolean;
    imagenUrl?: string;
    createdAt: number;
    updatedAt: number;
};
