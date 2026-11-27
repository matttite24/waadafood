import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/panel/PanelLayout";
import PreviewSheet from "@/components/panel/PreviewSheet";
import PublishBar, { errorText } from "@/components/panel/PublishBar";
import ProductSheet, { newProduct, type Product } from "@/components/panel/ProductSheet";
import { IconAgregar, IconListo, IconVista, IconAviso } from "@/components/icons";
import { cn } from "@/lib/utils";

const MAX_PRODUCTS = 5;
const KIOSKO_URL = import.meta.env.VITE_KIOSKO_URL;
const money = (n: number) => `$${n.toFixed(2)}`;

export default function MenuPage() {
    const store = useStore();
    const saveDraft = useMutation(api.stores.saveDraft);
    const menu = store.draftMenu;
    const [editing, setEditing] = useState<{ product: Product; isNew: boolean } | null>(null);
    const [previewing, setPreviewing] = useState(false);

    async function save(products: Product[], okMsg?: string) {
        try {
            await saveDraft({ menu: { ...menu, products } });
            if (okMsg) toast.success(okMsg);
            return true;
        } catch (e) {
            toast.error(errorText(e, "No se pudo guardar"));
            return false;
        }
    }

    async function onSave(p: Product) {
        const exists = menu.products.some((x) => x.id === p.id);
        const products = exists ? menu.products.map((x) => (x.id === p.id ? p : x)) : [...menu.products, p];
        if (await save(products, exists ? "Cambios guardados" : "Producto agregado")) setEditing(null);
    }

    async function onDelete(id: string) {
        if (await save(menu.products.filter((x) => x.id !== id), "Producto eliminado")) setEditing(null);
    }

    async function onMove(id: string, dir: -1 | 1) {
        const i = menu.products.findIndex((x) => x.id === id);
        const a = [...menu.products];
        [a[i], a[i + dir]] = [a[i + dir], a[i]];
        await save(a);
    }

    // El cambio de Agotado es el más frecuente durante el servicio: un toque, sin abrir nada.
    const toggle = (p: Product) =>
        save(menu.products.map((x) => (x.id === p.id ? { ...x, available: !x.available } : x)), p.available ? `«${p.name}» marcado como agotado` : `«${p.name}» disponible otra vez`);

    const editingIndex = editing ? menu.products.findIndex((x) => x.id === editing.product.id) : -1;

    return (
        <>
            <h1 className="text-2xl font-bold">Menú</h1>
            <p className="mb-4 text-sm text-muted-foreground">{menu.products.length} de {MAX_PRODUCTS} productos · toca uno para editarlo</p>

            <ul className="flex flex-col gap-3">
                {menu.products.map((p) => (
                    <li key={p.id} className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", !p.available && "bg-muted/40")}>
                        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditing({ product: p, isNew: false })} aria-label={`Editar ${p.name}`}>
                            <span className={cn("size-16 shrink-0 overflow-hidden rounded-xl border", !p.available && "opacity-50 grayscale")} style={{ background: menu.store.color }}>
                                {p.image && <img src={`${KIOSKO_URL}/i/${p.image.key}-480.webp`} alt="" className="size-full object-cover" loading="lazy" />}
                            </span>
                            <span className="min-w-0">
                                <span className={cn("block truncate text-base font-semibold", !p.available && "text-muted-foreground")}>{p.name}</span>
                                <span className="block text-sm text-muted-foreground">Desde {money(Math.min(...p.variants.map((v) => v.price)))}</span>
                            </span>
                        </button>
                        <Button size="sm" variant={p.available ? "soft" : "outline"} className={cn("shrink-0", !p.available && "border-destructive/40 text-destructive")} onClick={() => toggle(p)}
                            aria-pressed={!p.available} aria-label={p.available ? `Marcar ${p.name} como agotado` : `Marcar ${p.name} como disponible`}>
                            {p.available ? <><IconListo weight="fill" />Disponible</> : <><IconAviso weight="fill" />Agotado</>}
                        </Button>
                    </li>
                ))}
            </ul>

            {menu.products.length < MAX_PRODUCTS ? (
                <Button variant="outline" className="mt-3 w-full" onClick={() => setEditing({ product: newProduct(), isNew: true })}><IconAgregar />Agregar producto</Button>
            ) : (
                <p className="mt-3 text-center text-sm text-muted-foreground">Llegaste al máximo de {MAX_PRODUCTS} productos.</p>
            )}

            <div className="h-36" />
            <PublishBar store={store} showAlways left={<Button variant="outline" onClick={() => setPreviewing(true)}><IconVista />Vista previa</Button>} />

            <PreviewSheet open={previewing} store={store} onClose={() => setPreviewing(false)} />
            <ProductSheet
                product={editing?.product ?? null}
                isNew={editing?.isNew ?? false}
                index={editingIndex}
                total={menu.products.length}
                onClose={() => setEditing(null)}
                onSave={onSave}
                onDelete={onDelete}
                onMove={onMove}
            />
        </>
    );
}
