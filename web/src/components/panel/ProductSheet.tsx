import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { processPhoto, uploadPhoto } from "@/lib/photo";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Store } from "./PanelLayout";

export type Product = Store["draftMenu"]["products"][number];
type Group = Product["groups"][number];

// Límites de la spec §5.2 (el servidor los vuelve a comprobar en saveDraft).
const MAX_VARIANTS = 4, MAX_GROUPS = 3, MAX_OPTIONS = 8, DESC_MAX = 140, NAME_MAX = 40;

const KIOSKO_URL = import.meta.env.VITE_KIOSKO_URL;
const uid = () => crypto.randomUUID().slice(0, 8);

function Num({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    return (
        <Input
            type="number" inputMode="decimal" min={0} step="0.01" className="h-12 w-24 shrink-0"
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
    );
}

export function newProduct(): Product {
    return {
        id: uid(), name: "", desc: "", color: "#F4C542", upsell: false, available: true, groups: [],
        variants: [{ id: uid(), label: "Único", price: 0 }],
    };
}

export default function ProductSheet({
    product, onClose, onSave, onDelete, canDelete,
}: {
    product: Product | null;
    onClose: () => void;
    onSave: (p: Product) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    canDelete: boolean;
}) {
    const [p, setP] = useState<Product | null>(product);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const requestTickets = useAction(api.images.requestUploadTicket);
    useEffect(() => setP(product), [product]);
    if (!p) return <Drawer open={false} onOpenChange={() => {}}><DrawerContent /></Drawer>;

    const set = (patch: Partial<Product>) => setP({ ...p, ...patch });
    const setGroup = (i: number, g: Group) => set({ groups: p.groups.map((x, j) => (j === i ? g : x)) });

    async function onPickPhoto(file: File | undefined) {
        if (!file || !p) return;
        setUploading(true);
        try {
            const photo = await processPhoto(file);
            const { storeId, tickets } = await requestTickets({ files: Object.keys(photo.files) });
            await uploadPhoto(KIOSKO_URL, storeId, photo, tickets);
            setP((cur) => cur && { ...cur, image: { key: `${storeId}/${photo.hash}`, widths: [480, 720, 1080], lqip: photo.lqip, w: photo.w, h: photo.h } });
            toast.success("Foto lista. Guarda el producto para conservarla.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message.replace(/^.*Uncaught Error: /s, "").split("\n")[0] : "No se pudo subir la foto");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    async function run(fn: () => Promise<void>) {
        setBusy(true);
        try { await fn(); } finally { setBusy(false); }
    }

    return (
        <Drawer open={!!product} onOpenChange={(o) => !o && onClose()}>
            <DrawerContent className="max-h-[92vh]">
                <DrawerHeader><DrawerTitle>{p.name || "Nuevo producto"}</DrawerTitle></DrawerHeader>
                <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-4">
                    <div className="flex flex-col gap-2">
                        <Label>Nombre</Label>
                        <Input className="h-12" maxLength={NAME_MAX} value={p.name} onChange={(e) => set({ name: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>Descripción ({p.desc.length}/{DESC_MAX})</Label>
                        <Input className="h-12" maxLength={DESC_MAX} value={p.desc} onChange={(e) => set({ desc: e.target.value })} />
                    </div>
                    <section className="flex flex-col gap-3">
                        <h3 className="font-semibold">Foto</h3>
                        <div className="flex items-center gap-3">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted" style={p.image ? { backgroundImage: `url(${p.image.lqip})`, backgroundSize: "cover" } : undefined}>
                                {p.image && <img src={`${KIOSKO_URL}/i/${p.image.key}-480.webp`} alt="" className="h-full w-full object-cover" />}
                            </div>
                            <div className="flex flex-1 flex-col gap-2">
                                <Button variant="outline" className="h-12" disabled={uploading} onClick={() => fileRef.current?.click()}>
                                    {uploading ? "Subiendo…" : p.image ? "Cambiar foto" : "Subir foto"}
                                </Button>
                                {p.image && !uploading && <Button variant="ghost" className="h-10" onClick={() => set({ image: undefined })}>Quitar foto</Button>}
                            </div>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickPhoto(e.target.files?.[0])} />
                    </section>
                    <div className="flex gap-3">
                        <div className="flex flex-1 flex-col gap-2">
                            <Label>Etiqueta (opcional)</Label>
                            <Input className="h-12" placeholder="La más pedida" value={p.tag ?? ""} onChange={(e) => set({ tag: e.target.value || undefined })} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Color</Label>
                            <input type="color" className="h-12 w-16 rounded-xl border" value={p.color} onChange={(e) => set({ color: e.target.value })} />
                        </div>
                    </div>

                    <section className="flex flex-col gap-3">
                        <h3 className="font-semibold">Tamaños o variantes</h3>
                        {p.variants.map((v, i) => (
                            <div key={v.id} className="flex items-center gap-2">
                                <Input className="h-12" placeholder="Nombre" value={v.label}
                                    onChange={(e) => set({ variants: p.variants.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                                <Num value={v.price} onChange={(n) => set({ variants: p.variants.map((x, j) => (j === i ? { ...x, price: n } : x)) })} />
                                <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0" disabled={p.variants.length <= 1}
                                    onClick={() => set({ variants: p.variants.filter((_, j) => j !== i) })}>✕</Button>
                            </div>
                        ))}
                        {p.variants.length < MAX_VARIANTS && (
                            <Button variant="outline" className="h-12" onClick={() => set({ variants: [...p.variants, { id: uid(), label: "", price: 0 }] })}>+ Agregar variante</Button>
                        )}
                    </section>

                    <section className="flex flex-col gap-3">
                        <h3 className="font-semibold">Extras y opciones</h3>
                        <p className="-mt-2 text-sm text-muted-foreground">Ej.: «¿Lo hacemos combo?» con la opción «Papas y bebida» (+$2.50).</p>
                        {p.groups.map((g, gi) => (
                            <div key={g.id} className="flex flex-col gap-3 rounded-2xl border p-3">
                                <div className="flex gap-2">
                                    <Input className="h-12" placeholder="Pregunta (¿Le agregamos algo?)" value={g.title} onChange={(e) => setGroup(gi, { ...g, title: e.target.value })} />
                                    <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0" onClick={() => set({ groups: p.groups.filter((_, j) => j !== gi) })}>✕</Button>
                                </div>
                                <div className="flex gap-2">
                                    {(["one", "many"] as const).map((t) => (
                                        <Button key={t} variant={g.type === t ? "default" : "outline"} className="h-12 flex-1" onClick={() => setGroup(gi, { ...g, type: t })}>
                                            {t === "one" ? "Elegir una" : "Elegir varias"}
                                        </Button>
                                    ))}
                                </div>
                                {g.options.map((o, oi) => (
                                    <div key={o.id} className="flex items-center gap-2">
                                        <Input className="h-12" placeholder="Opción" value={o.label}
                                            onChange={(e) => setGroup(gi, { ...g, options: g.options.map((x, j) => (j === oi ? { ...x, label: e.target.value } : x)) })} />
                                        <Num value={o.price} onChange={(n) => setGroup(gi, { ...g, options: g.options.map((x, j) => (j === oi ? { ...x, price: n } : x)) })} />
                                        <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0" disabled={g.options.length <= 1}
                                            onClick={() => setGroup(gi, { ...g, options: g.options.filter((_, j) => j !== oi) })}>✕</Button>
                                    </div>
                                ))}
                                {g.options.length < MAX_OPTIONS && (
                                    <Button variant="outline" className="h-12" onClick={() => setGroup(gi, { ...g, options: [...g.options, { id: uid(), label: "", price: 0 }] })}>+ Agregar opción</Button>
                                )}
                            </div>
                        ))}
                        {p.groups.length < MAX_GROUPS && (
                            <Button variant="outline" className="h-12"
                                onClick={() => set({ groups: [...p.groups, { id: uid(), title: "", type: "many", options: [{ id: uid(), label: "", price: 0 }] }] })}>+ Agregar pregunta</Button>
                        )}
                    </section>

                </div>
                <DrawerFooter>
                    <Button className="h-12" disabled={busy || uploading || !p.name.trim()} onClick={() => run(() => onSave(p))}>Guardar</Button>
                    {canDelete && <Button variant="ghost" className="h-12 text-destructive" disabled={busy} onClick={() => run(() => onDelete(p.id))}>Eliminar producto</Button>}
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
