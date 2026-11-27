import { useState } from "react";
import { Link } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/panel/PanelLayout";
import StoreSettingsSheet, { type StoreSettings } from "@/components/panel/StoreSettingsSheet";

const errMsg = (e: unknown, fallback: string) =>
    e instanceof Error ? e.message.replace(/^.*Uncaught Error: /s, "").split("\n")[0] : fallback;

export default function Cuenta() {
    const store = useStore();
    const { logout } = useKindeAuth();
    const saveDraft = useMutation(api.stores.saveDraft);
    const publish = useMutation(api.stores.publish);
    const [editing, setEditing] = useState(false);
    const link = `https://waadafood.com/${store.slug}`;
    const { delivery, payments } = store.draftMenu.store;

    async function onPublish() {
        try {
            const v = await publish({});
            toast.success(`Publicado (versión ${v}). Visible en unos minutos.`);
        } catch (e) {
            toast.error(errMsg(e, "No se pudo publicar"));
        }
    }

    async function onSaveSettings(s: StoreSettings) {
        try {
            await saveDraft({ menu: { ...store.draftMenu, store: s } });
            toast.success("Guardado. Publica para que se vea en tu link.");
            setEditing(false);
        } catch (e) {
            toast.error(errMsg(e, "No se pudo guardar"));
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

    const entrega = [delivery.enabled && "domicilio", delivery.pickup && "retiro"].filter(Boolean).join(" y ");

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
                <div className="mb-1 flex items-center justify-between">
                    <p className="font-semibold">Datos del local</p>
                    <span className="h-5 w-5 rounded-full border" style={{ background: store.draftMenu.store.color }} />
                </div>
                <p className="text-sm text-muted-foreground">Entrega: {entrega || "sin configurar"}</p>
                <p className="mb-3 text-sm text-muted-foreground">Pago: {payments.join(", ") || "sin configurar"}</p>
                <Button variant="outline" className="h-12 w-full" onClick={() => setEditing(true)}>Editar</Button>
            </section>
            <section className="mb-4 rounded-2xl border p-4">
                <p className="text-sm text-muted-foreground">Tu kiosko</p>
                <p className="mb-3 break-all font-medium">{link}</p>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-12 flex-1" onClick={onCopy}>Copiar</Button>
                    <Button variant="outline" className="h-12 flex-1" onClick={onShare}>Compartir</Button>
                </div>
                <Button asChild variant="outline" className="mt-2 h-12 w-full"><Link to="/cuenta/qr">Mi QR para imprimir</Link></Button>
            </section>
            <Button className="mb-3 h-12 w-full" onClick={onPublish}>Publicar cambios</Button>
            <Button variant="ghost" className="h-12 w-full" onClick={() => logout()}>Cerrar sesión</Button>

            <StoreSettingsSheet open={editing} settings={store.draftMenu.store} onClose={() => setEditing(false)} onSave={onSaveSettings} />
        </>
    );
}
