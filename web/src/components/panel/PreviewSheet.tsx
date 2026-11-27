import { useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { Store } from "./PanelLayout";

const KIOSKO_URL = import.meta.env.VITE_KIOSKO_URL;

/**
 * Vista previa: carga el kiosko real en un iframe enviándole el borrador por POST (sin guardar ni publicar).
 * Así lo que ves es exactamente lo que verá el cliente, con el mismo código del servidor.
 */
export default function PreviewSheet({ open, store, onClose }: { open: boolean; store: Store; onClose: () => void }) {
    const formRef = useRef<HTMLFormElement>(null);
    const menu = JSON.stringify(store.draftMenu);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => formRef.current?.submit(), 50); // espera a que el iframe exista en el DOM
        return () => clearTimeout(t);
    }, [open, menu]);

    return (
        <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
            <DrawerContent className="h-[94vh]">
                <DrawerTitle className="sr-only">Vista previa</DrawerTitle>
                <div className="flex items-center justify-between px-4 pb-2">
                    <p className="text-sm font-medium">Vista previa del borrador</p>
                    <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
                </div>
                <form ref={formRef} method="POST" action={`${KIOSKO_URL}/${store.slug}?preview=1`} target="kiosko-preview" className="hidden">
                    <input type="hidden" name="menu" value={menu} />
                </form>
                <iframe name="kiosko-preview" title="Vista previa del kiosko" className="mx-auto w-full max-w-[420px] flex-1 border-0 bg-white" />
            </DrawerContent>
        </Drawer>
    );
}
