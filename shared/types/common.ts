import { Id } from "../../convex/_generated/dataModel";

export type Cliente = {
    _id: Id<"clientes">;
    comercioId: Id<"comercios">;
    nombre: string;
    telefono: string;
    email?: string;
    direccion?: string;
    notas?: string;
    tags?: Id<"tags">[];
    createdAt: number;
    updatedAt: number;
};

export type Comercio = {
    _id: Id<"comercios">;
    userId: string;
    nombre: string;
    descripcion?: string;
    telefono?: string;
    direccion?: string;
    createdAt: number;
    updatedAt: number;
};
