import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/panel/PanelLayout";

export default function Cuenta() {
    const store = useStore();
    const { logout } = useKindeAuth();
    const publish = useMutation(api.stores.publish);
    const link = `https://waadafood.com/${store.slug}`;

    async function onPublish() {
        try {
            const v = await publish({});
            toast.success(`Publicado (versión ${v}). Visible en unos minutos.`);
        } catch {
            toast.error("No se pudo publicar");
        }
    }

    async function onCopy() {
        await navigator.clipboard.writeText(link);
        toast.success("Enlace copiado");
    }

    async function onShare() {
        if (navigator.share) await navigator.share({ title: store.name, url: link }).catch(() => {});
        else await onCopy();
    }

    return (
        <>
            <h1 className="mb-4 text-2xl font-bold">Cuenta</h1>
            <section className="mb-4 rounded-2xl border p-4">
                <p className="font-semibold">{store.name}</p>
                <p className="text-sm text-muted-foreground">
                    WhatsApp {store.waNumber} · {store.waVerified ? "verificado" : "sin verificar"}
                </p>
                <p className="text-sm text-muted-foreground">Plan {store.plan === "pro" ? "Pro" : "Gratis"}</p>
            </section>
            <section className="mb-4 rounded-2xl border p-4">
                <p className="text-sm text-muted-foreground">Tu kiosko</p>
                <p className="mb-3 break-all font-medium">{link}</p>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-12 flex-1" onClick={onCopy}>Copiar</Button>
                    <Button variant="outline" className="h-12 flex-1" onClick={onShare}>Compartir</Button>
                </div>
            </section>
            <Button className="mb-3 h-12 w-full" onClick={onPublish}>Publicar cambios</Button>
            <Button variant="ghost" className="h-12 w-full" onClick={() => logout()}>Cerrar sesión</Button>
        </>
    );
}
