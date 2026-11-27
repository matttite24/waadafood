import { useState, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { IconOk, IconAviso } from "@/components/icons";
import type { Store } from "./PanelLayout";

const strip = (m: unknown) => JSON.stringify(m, (k, v) => (k === "version" ? undefined : v));

/** ¿El borrador difiere de lo publicado? (se ignora el número de versión) */
export const hasUnpublished = (store: Store) => !store.publishedMenu || strip(store.draftMenu) !== strip(store.publishedMenu);

export const errorText = (e: unknown, fallback: string) =>
    e instanceof Error ? e.message.replace(/^.*Uncaught Error: /s, "").split("\n")[0] : fallback;

/**
 * Barra flotante de publicar, la misma en Menú y Cuenta (antes cada una tenía su propia versión).
 * Se ve encima de la barra de navegación. `showAlways` la deja visible aunque no haya cambios (Menú).
 */
export default function PublishBar({ store, left, showAlways }: { store: Store; left?: ReactNode; showAlways?: boolean }) {
    const publish = useMutation(api.stores.publish);
    const [busy, setBusy] = useState(false);
    const dirty = hasUnpublished(store);
    if (!dirty && !showAlways) return null;

    async function onPublish() {
        setBusy(true);
        try {
            await publish({});
            toast.success("Publicado. Tus clientes lo verán en unos minutos.");
        } catch (e) {
            toast.error(errorText(e, "No se pudo publicar"));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div
            className="fixed inset-x-3 z-30 mx-auto max-w-sm rounded-2xl border border-black/5 bg-background/95 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.10)] backdrop-blur-md"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 88px)" }}
        >
            <p className={`mb-2 flex items-center justify-center gap-1.5 text-sm font-medium ${dirty ? "text-amber-700" : "text-emerald-700"}`}>
                {dirty ? <><IconAviso weight="fill" className="size-4" />Cambios sin publicar</> : <><IconOk weight="bold" className="size-4" />Todo publicado</>}
            </p>
            <div className="flex gap-2">
                {left}
                <Button className="flex-1" disabled={!dirty || busy} onClick={onPublish}>
                    {busy ? "Publicando…" : "Publicar"}
                </Button>
            </div>
        </div>
    );
}
