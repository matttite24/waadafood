import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/components/panel/PanelLayout";
import ProductSheet, { newProduct, type Product } from "@/components/panel/ProductSheet";

const MAX_PRODUCTS = 5;
const money = (n: number) => `$${n.toFixed(2)}`;
const strip = (m: unknown) => JSON.stringify(m, (k, v) => (k === "version" ? undefined : v));

export default function MenuPage() {
    const store = useStore();
    const saveDraft = useMutation(api.stores.saveDraft);
    const publish = useMutation(api.stores.publish);
    const menu = store.draftMenu;
    const [editing, setEditing] = useState<Product | null>(null);
    const [publishing, setPublishing] = useState(false);

    // "Cambios sin publicar": el borrador difiere de lo publicado (se ignora el número de versión).
    const dirty = !store.publishedMenu || strip(menu) !== strip(store.publishedMenu);

    async function save(products: Product[], okMsg?: string) {
        try {
            await saveDraft({ menu: { ...menu, products } });
            if (okMsg) toast.success(okMsg);
            return true;
        } catch (e) {
            toast.error(e instanceof Error ? e.message.replace(/^.*Uncaught Error: /s, "").split("\n")[0] : "No se pudo guardar");
            return false;
        }
    }

    async function onSave(p: Product) {
        const exists = menu.products.some((x) => x.id === p.id);
        const products = exists ? menu.products.map((x) => (x.id === p.id ? p : x)) : [...menu.products, p];
        if (await save(products, "Guardado")) setEditing(null);
    }

    async function onDelete(id: string) {
        if (await save(menu.products.filter((x) => x.id !== id), "Producto eliminado")) setEditing(null);
    }

    function move(i: number, d: -1 | 1) {
        const a = [...menu.products];
        [a[i], a[i + d]] = [a[i + d], a[i]];
        void save(a);
    }

    async function onPublish() {
        setPublishing(true);
        try {
            const v = await publish({});
            toast.success(`Publicado (versión ${v}). Visible en unos minutos.`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message.replace(/^.*Uncaught Error: /s, "").split("\n")[0] : "No se pudo publicar");
        } finally {
            setPublishing(false);
        }
    }

    return (
        <>
            <h1 className="mb-1 text-2xl font-bold">Menú</h1>
            <p className="mb-4 text-sm text-muted-foreground">{menu.products.length} de {MAX_PRODUCTS} productos</p>
            <ul className="flex flex-col gap-3">
                {menu.products.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-2 rounded-2xl border p-3">
                        <div className="flex flex-col">
                            <button aria-label="Subir" className="h-6 w-8 text-muted-foreground disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
                            <button aria-label="Bajar" className="h-6 w-8 text-muted-foreground disabled:opacity-30" disabled={i === menu.products.length - 1} onClick={() => move(i, 1)}>▼</button>
                        </div>
                        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditing(p)}>
                            <span className="h-12 w-12 shrink-0 rounded-xl" style={{ background: p.color }} />
                            <span className="min-w-0">
                                <span className="block truncate font-semibold">{p.name}</span>
                                <span className="block text-sm text-muted-foreground">Desde {money(Math.min(...p.variants.map((v) => v.price)))}</span>
                            </span>
                        </button>
                        <div className="flex flex-col items-center gap-1">
                            <Switch checked={p.available} onCheckedChange={(c) => save(menu.products.map((x) => (x.id === p.id ? { ...x, available: c } : x)))} />
                            <span className="text-[11px] text-muted-foreground">{p.available ? "Disponible" : "Agotado"}</span>
                        </div>
                    </li>
                ))}
            </ul>
            {menu.products.length < MAX_PRODUCTS && (
                <Button variant="outline" className="mt-3 h-12 w-full" onClick={() => setEditing(newProduct())}>+ Agregar producto</Button>
            )}

            <div className="h-24" />
            <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md border-t bg-background/95 p-3 backdrop-blur" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
                {dirty && <p className="mb-2 text-center text-xs font-medium text-amber-600">Cambios sin publicar</p>}
                <Button className="h-12 w-full" disabled={!dirty || publishing} onClick={onPublish}>
                    {publishing ? "Publicando…" : dirty ? "Publicar" : "Todo publicado"}
                </Button>
            </div>

            <ProductSheet product={editing} onClose={() => setEditing(null)} onSave={onSave} onDelete={onDelete} canDelete={menu.products.length > 1 && menu.products.some((x) => x.id === editing?.id)} />
        </>
    );
}
