import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

/**
 * Hook personalizado para obtener el comercio del usuario autenticado.
 * Automáticamente crea un comercio si el usuario no tiene uno.
 */
export function useComercio() {
    const { user, isLoading: isAuthLoading } = useKindeAuth();
    const [comercioId, setComercioId] = useState<Id<"comercios"> | null>(null);
    const [hasInitialized, setHasInitialized] = useState(false);

    const getOrCreate = useMutation(api.comercios.getOrCreateComercio);
    const comercio = useQuery(
        api.comercios.get,
        comercioId ? { id: comercioId } : "skip"
    );

    useEffect(() => {
        if (!user?.id || isAuthLoading || hasInitialized) return;

        // Auto-crear o obtener comercio
        getOrCreate({
            userId: user.id,
            userEmail: user.email || undefined,
        })
            .then((result) => {
                if (result?._id) {
                    setComercioId(result._id);
                    setHasInitialized(true);
                }
            })
            .catch((error) => {
                console.error("Error al obtener/crear comercio:", error);
            });
    }, [user?.id, isAuthLoading, hasInitialized, getOrCreate]);

    return {
        comercio,
        isLoading: isAuthLoading || !hasInitialized || comercio === undefined,
        userId: user?.id,
    };
}
