import { useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, PriceInput } from "@/components/ui/field";
import { IconButton, Section, SheetHead } from "./kit";
import { IconAgregar, IconBajar, IconBorrar, IconFoto, IconSubir } from "@/components/icons";
import { errorText } from "./PublishBar";
import { processPhoto, uploadPhoto } from "@/lib/photo";
import { cn } from "@/lib/utils";
import type { Store } from "./PanelLayout";

export type Product = Store["draftMenu"]["products"][number];
type Group = Product["groups"][number];

// Límites de la spec §5.2 (el servidor los vuelve a comprobar en saveDraft).
const MAX_VARIANTS = 4, MAX_GROUPS = 3, MAX_OPTIONS = 8, DESC_MAX = 140, NAME_MAX = 40;
const KIOSKO_URL = import.meta.env.VITE_KIOSKO_URL;
const uid = () => crypto.randomUUID().slice(0, 8);

export function newProduct(): Product {
    return { id: uid(), name: "", desc: "", color: "#F4C542", upsell: false, available: true, groups: [], variants: [{ id: uid(), label: "Único", price: 0 }] };
}

/** Primer problema del producto, escrito para el dueño; null si todo está bien. */
function problem(p: Product): string | null {
    if (!p.name.trim()) return "Escribe el nombre del producto.";
    if (p.variants.length > 1) {
        const i = p.variants.findIndex((v) => !v.label.trim());
        if (i >= 0) return `Escribe el nombre de la variante ${i + 1} (por ejemplo «Simple» o «Doble»).`;
    }
    for (const [gi, g] of p.groups.entries()) {
        const where = g.title.trim() ? `«${g.title.trim()}»` : `la pregunta ${gi + 1}`;
        const oi = g.options.findIndex((o) => !o.label.trim());
        if (oi >= 0) return `Escribe el nombre de la opción ${oi + 1} en ${where}.`;
    }
    return null;
}

export default function ProductSheet({
    product, index, total, onClose, onSave, onDelete, onMove, isNew,
}: {
    product: Product | null;
    index: number;
    total: number;
    isNew: boolean;
    onClose: () => void;
    onSave: (p: Product) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onMove: (id: string, dir: -1 | 1) => Promise<void>;
}) {
    const [p, setP] = useState<Product | null>(product);
    const [initial, setInitial] = useState<string>("");
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [askDiscard, setAskDiscard] = useState(false);
    const [askDelete, setAskDelete] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const requestTickets = useAction(api.images.requestUploadTicket);

    useEffect(() => {
        setP(product);
        setInitial(JSON.stringify(product));
        setAskDiscard(false);
        setAskDelete(false);
    }, [product]);

    const dirty = useMemo(() => !!p && (isNew ? true : JSON.stringify(p) !== initial), [p, initial, isNew]);
    const err = p ? problem(p) : null;

    if (!p) return <Drawer open={false} onOpenChange={() => {}}><DrawerContent /></Drawer>;

    const set = (patch: Partial<Product>) => setP({ ...p, ...patch });
    const setGroup = (i: number, g: Group) => set({ groups: p.groups.map((x, j) => (j === i ? g : x)) });
    const setVariant = (i: number, patch: Partial<Product["variants"][number]>) => set({ variants: p.variants.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

    function requestClose() {
        if (dirty && !askDiscard) { setAskDiscard(true); return; }
        onClose();
    }

    async function run(fn: () => Promise<void>) {
        setBusy(true);
        try { await fn(); } finally { setBusy(false); }
    }

    async function onPickPhoto(file: File | undefined) {
        if (!file || !p) return;
        setUploading(true);
        try {
            const photo = await processPhoto(file);
            const { storeId, tickets } = await requestTickets({ files: Object.keys(photo.files) });
            await uploadPhoto(KIOSKO_URL, storeId, photo, tickets);
            setP((cur) => cur && { ...cur, image: { key: `${storeId}/${photo.hash}`, widths: [480, 720, 1080], lqip: photo.lqip, w: photo.w, h: photo.h } });
            toast.success("Foto lista. Pulsa Guardar para conservarla.");
        } catch (e) {
            toast.error(errorText(e, "No se pudo subir la foto"));
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    const single = p.variants.length === 1;

    return (
        <Drawer open={!!product} onOpenChange={(o) => !o && requestClose()}>
            <DrawerContent className="max-h-[94vh]">
                <SheetHead title={p.name.trim() || "Nuevo producto"} subtitle={isNew ? "Completa lo básico y guarda." : undefined} />
                <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">

                    <Section title="Lo básico">
                        <div className="flex flex-col gap-4">
                            <Field label="Nombre" hint={`${p.name.length}/${NAME_MAX}`}>
                                <Input maxLength={NAME_MAX} autoComplete="off" autoCapitalize="sentences" enterKeyHint="next" placeholder="Ej.: Hamburguesa de la casa"
                                    value={p.name} onChange={(e) => set({ name: e.target.value })} />
                            </Field>
                            <Field label="Descripción" optional hint={`${p.desc.length}/${DESC_MAX} · lo que verá el cliente bajo el nombre`}>
                                <Input maxLength={DESC_MAX} autoComplete="off" autoCapitalize="sentences" enterKeyHint="done" placeholder="Ej.: Carne a la brasa, queso y salsa"
                                    value={p.desc} onChange={(e) => set({ desc: e.target.value })} />
                            </Field>
                            <Field label="Etiqueta" optional hint="Un sello corto sobre el producto">
                                <Input maxLength={24} autoComplete="off" placeholder="Ej.: La más pedida" value={p.tag ?? ""} onChange={(e) => set({ tag: e.target.value || undefined })} />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Foto">
                        <div className="flex items-center gap-4">
                            <div className="size-24 shrink-0 overflow-hidden rounded-xl border" style={{ background: p.image ? `url(${p.image.lqip}) center/cover` : p.color }}>
                                {p.image && <img src={`${KIOSKO_URL}/i/${p.image.key}-480.webp`} alt="" className="size-full object-cover" />}
                            </div>
                            <div className="flex flex-1 flex-col gap-2">
                                <Button variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
                                    <IconFoto />{uploading ? "Subiendo…" : p.image ? "Cambiar foto" : "Subir foto"}
                                </Button>
                                {p.image && !uploading && <Button variant="ghost" size="sm" onClick={() => set({ image: undefined })}>Quitar foto</Button>}
                            </div>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickPhoto(e.target.files?.[0])} />
                        {!p.image && (
                            <div className="mt-4 flex items-center justify-between gap-3">
                                <span className="text-sm text-muted-foreground">Sin foto se muestra este color de fondo</span>
                                <input type="color" aria-label="Color de fondo" className="h-12 w-16 shrink-0 rounded-xl border" value={p.color} onChange={(e) => set({ color: e.target.value })} />
                            </div>
                        )}
                    </Section>

                    <Section title={single ? "Precio" : "Tamaños o variantes"}>
                        <div className="flex flex-col gap-3">
                            {single ? (
                                <Field label="Precio" hint="En dólares">
                                    <PriceInput value={p.variants[0].price} onChange={(n) => setVariant(0, { price: n })} />
                                </Field>
                            ) : (
                                <>
                                    <div className="flex gap-2 px-1 text-sm font-medium"><span className="flex-1">Nombre</span><span className="w-28">Precio</span><span className="w-12" /></div>
                                    {p.variants.map((v, i) => (
                                        <div key={v.id} className="flex items-center gap-2">
                                            <Input aria-label={`Nombre de la variante ${i + 1}`} autoComplete="off" autoCapitalize="sentences" placeholder="Ej.: Doble" value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} />
                                            <PriceInput aria-label={`Precio de ${v.label || `la variante ${i + 1}`}`} className="w-28" value={v.price} onChange={(n) => setVariant(i, { price: n })} />
                                            <IconButton label={`Quitar ${v.label || `variante ${i + 1}`}`} className="shrink-0 text-muted-foreground" onClick={() => set({ variants: p.variants.filter((_, j) => j !== i) })}><IconBorrar /></IconButton>
                                        </div>
                                    ))}
                                </>
                            )}
                            {p.variants.length < MAX_VARIANTS && (
                                <Button variant="outline" onClick={() => set({ variants: [...(single && p.variants[0].label === "Único" ? [{ ...p.variants[0], label: "Normal" }] : p.variants), { id: uid(), label: "", price: p.variants[0].price }] })}>
                                    <IconAgregar />{single ? "Ofrecer tamaños o variantes" : "Agregar otra variante"}
                                </Button>
                            )}
                        </div>
                    </Section>

                    <section className="flex flex-col gap-3">
                        <div>
                            <h2 className="font-semibold">Extras y preguntas</h2>
                            <p className="text-sm text-muted-foreground">Lo que el cliente puede añadir. Ej.: «¿Lo hacemos combo?» con la opción «Papas y bebida» +$2.50.</p>
                        </div>
                        {p.groups.map((g, gi) => (
                            <Section key={g.id} title={`Pregunta ${gi + 1}`} action={<IconButton label={`Quitar la pregunta ${gi + 1}`} className="-my-2 text-muted-foreground" onClick={() => set({ groups: p.groups.filter((_, j) => j !== gi) })}><IconBorrar /></IconButton>}>
                                <div className="flex flex-col gap-4">
                                    <Field label="Pregunta" hint="Lo que lee el cliente">
                                        <Input autoComplete="off" autoCapitalize="sentences" placeholder="Ej.: ¿Lo hacemos combo?" value={g.title} onChange={(e) => setGroup(gi, { ...g, title: e.target.value })} />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Cuántas puede elegir">
                                        {(["one", "many"] as const).map((t) => (
                                            <Button key={t} variant={g.type === t ? "default" : "outline"} onClick={() => setGroup(gi, { ...g, type: t, prefix: t === "one" ? undefined : g.prefix })}>
                                                {t === "one" ? "Elige una" : "Elige varias"}
                                            </Button>
                                        ))}
                                    </div>
                                    {g.type === "many" && (
                                        <label className="flex items-center justify-between gap-3 text-sm">
                                            <span>Son ingredientes para <b>quitar</b> (se muestra «Sin …»)</span>
                                            <Switch checked={g.prefix === "Sin"} onCheckedChange={(c) => setGroup(gi, { ...g, prefix: c ? "Sin" : undefined })} />
                                        </label>
                                    )}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-2 px-1 text-sm font-medium"><span className="flex-1">Opción</span><span className="w-28">Precio extra</span><span className="w-12" /></div>
                                        {g.options.map((o, oi) => (
                                            <div key={o.id} className="flex items-center gap-2">
                                                <Input aria-label={`Nombre de la opción ${oi + 1}`} autoComplete="off" autoCapitalize="sentences" placeholder="Ej.: Papas y bebida" value={o.label}
                                                    onChange={(e) => setGroup(gi, { ...g, options: g.options.map((x, j) => (j === oi ? { ...x, label: e.target.value } : x)) })} />
                                                <PriceInput aria-label={`Precio extra de ${o.label || `la opción ${oi + 1}`}`} className="w-28" value={o.price}
                                                    onChange={(n) => setGroup(gi, { ...g, options: g.options.map((x, j) => (j === oi ? { ...x, price: n } : x)) })} />
                                                <IconButton label={`Quitar ${o.label || `opción ${oi + 1}`}`} className="shrink-0 text-muted-foreground" disabled={g.options.length <= 1}
                                                    onClick={() => setGroup(gi, { ...g, options: g.options.filter((_, j) => j !== oi) })}><IconBorrar /></IconButton>
                                            </div>
                                        ))}
                                        {g.options.length < MAX_OPTIONS && (
                                            <Button variant="outline" onClick={() => setGroup(gi, { ...g, options: [...g.options, { id: uid(), label: "", price: 0 }] })}><IconAgregar />Agregar opción</Button>
                                        )}
                                    </div>
                                </div>
                            </Section>
                        ))}
                        {p.groups.length < MAX_GROUPS && (
                            <Button variant="outline"
                                onClick={() => set({ groups: [...p.groups, { id: uid(), title: "", type: "many", options: [{ id: uid(), label: "", price: 0 }] }] })}>
                                <IconAgregar />Agregar pregunta
                            </Button>
                        )}
                    </section>

                    {!isNew && total > 1 && (
                        <Section title="Posición en el menú" action={<span className="text-sm text-muted-foreground">{index + 1} de {total}</span>}>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" disabled={index === 0 || busy} onClick={() => run(() => onMove(p.id, -1))}><IconSubir />Subir</Button>
                                <Button variant="outline" disabled={index === total - 1 || busy} onClick={() => run(() => onMove(p.id, 1))}><IconBajar />Bajar</Button>
                            </div>
                        </Section>
                    )}
                </div>

                <DrawerFooter className="border-t bg-background">
                    {askDiscard ? (
                        <>
                            <p className="text-center text-sm font-medium">Tienes cambios sin guardar. ¿Salir sin guardarlos?</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" onClick={() => setAskDiscard(false)}>Seguir editando</Button>
                                <Button variant="destructive" onClick={onClose}>Descartar</Button>
                            </div>
                        </>
                    ) : askDelete ? (
                        <>
                            <p className="text-center text-sm font-medium">¿Eliminar «{p.name || "este producto"}»?</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" onClick={() => setAskDelete(false)}>No</Button>
                                <Button variant="destructive" disabled={busy} onClick={() => run(() => onDelete(p.id))}>Sí, eliminar</Button>
                            </div>
                        </>
                    ) : (
                        <>
                            {err && <p role="alert" className="text-center text-sm text-destructive">{err}</p>}
                            <Button size="lg" disabled={busy || uploading || !!err || (!isNew && !dirty)} onClick={() => run(() => onSave(p))}>
                                {busy ? "Guardando…" : isNew ? "Agregar al menú" : dirty ? "Guardar cambios" : "Sin cambios"}
                            </Button>
                            {!isNew && total > 1 && (
                                <Button variant="ghost" className={cn("text-destructive hover:text-destructive")} disabled={busy} onClick={() => setAskDelete(true)}>
                                    <IconBorrar />Eliminar producto
                                </Button>
                            )}
                        </>
                    )}
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
