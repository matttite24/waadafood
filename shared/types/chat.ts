import { Id } from "../../convex/_generated/dataModel";

export type TipoMensaje = "text" | "image" | "audio";
export type RolMensaje = "user" | "assistant";

export type Mensaje = {
    _id: Id<"mensajes">;
    conversacionId: Id<"conversaciones">;
    contenido: string;
    tipo: TipoMensaje;
    rol: RolMensaje;
    createdAt: number;
};

export type Conversacion = {
    _id: Id<"conversaciones">;
    comercioId: Id<"comercios">;
    clienteId: Id<"clientes">;
    ultimoMensaje?: string;
    ultimoMensajeAt?: number;
    noLeidos: number;
    requiere_atencion_humana: boolean;
    ia_activa: boolean;
    createdAt: number;
    updatedAt: number;
};
