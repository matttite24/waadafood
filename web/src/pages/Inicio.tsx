import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import Registro from "./Registro";

export default function Inicio() {
    const { logout } = useKindeAuth();
    const { isLoading, isAuthenticated } = useConvexAuth();
    const publish = useMutation(api.stores.publish);
    const store = useQuery(api.stores.getMine, isAuthenticated ? {} : "skip");

    // Esperar a que Convex valide el token: sin sesión getMine devuelve null y se vería el registro por error.
    if (isLoading || !isAuthenticated || store === undefined) return null;
    if (store === null) return <Registro />;

    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
            <h1 className="text-2xl font-bold">{store.name}</h1>
            <p className="text-sm text-muted-foreground">
                Tu kiosko: <span className="font-medium">waadafood.com/{store.slug}</span>
            </p>
            <p className="text-sm">
                WhatsApp: {store.waNumber} {store.waVerified ? "· verificado" : "· sin verificar"}
            </p>
            <Button onClick={async () => {
                try {
                    const v = await publish({});
                    toast.success(`Publicado (versión ${v}). Visible en unos minutos.`);
                } catch {
                    toast.error("No se pudo publicar");
                }
            }}>Publicar</Button>
            <Button variant="outline" onClick={() => logout()}>Salir</Button>
        </main>
    );
}
