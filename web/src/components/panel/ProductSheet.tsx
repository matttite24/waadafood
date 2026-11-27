import { useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, PriceInput } from "@/components/ui/field";
import { COLORS, ColorPicker } from "@/components/ui/color-picker";
import { IconButton, Section, SheetHead } from "./kit";
import { IconAgregar, IconBajar, IconBorrar, IconFoto, IconSubir } from "@/components/icons";
import { errorText } from "./PublishBar";
import { processPhoto, uploadPhoto } from "@/lib/photo";
import type { Store } from "./PanelLayout";

export type Product = Store["draftMenu"]["products"][number];

// Límites de la spec §5.2 (el servidor los vuelve a comprobar en saveDraft).
const MAX_VARIANTS = 4, MAX_EXTRAS = 8, DESC_MAX = 140, NAME_MAX = 40;
const KIOSKO_URL = import.meta.env.VITE_KIOSKO_URL;
const uid = () => crypto.randomUUID().slice(0, 8);


// Modelo simple: un producto tiene VARIANTES (el cliente elige una) y EXTRAS (agrega los que quiera).
// Por dentro los extras son un único grupo de "elegir varias"; el servidor y el kiosko no cambian.
const EXTRAS_TITLE = "¿Quieres agregar algo?";
type Extra = Product["groups"][number]["options"][number];

/** ¿Usa solo el modelo simple? Los productos viejos con varias preguntas o "elegir una" no lo cumplen. */
const isSimple = (p: Product) => p.groups.length === 0 || (p.groups.length === 1 && p.groups[0].type === "many" && !p.groups[0].prefix);
const extrasOf = (p: Product): Extra[] => (isSimple(p) ? p.groups[0]?.options ?? [] : []);
const withExtras = (p: Product, options: Extra[]): Product =>
    ({ ...p, groups: options.length === 0 ? [] : [{ id: p.groups[0]?.id ?? uid(), title: EXTRAS_TITLE, type: "many" as const, options }] });
/** Convierte un producto con varias preguntas en una sola lista de extras (junta todas las opciones). */
const simplify = (p: Product): Product => withExtras({ ...p, groups: [] }, p.groups.flatMap((g) => g.options).slice(0, MAX_EXTRAS));

export function newProduct(): Product {
    return { id: uid(), name: "", desc: "", color: COLORS[2].hex, upsell: false, available: true, groups: [], variants: [{ id: uid(), label: "Único", price: 0 }] };
}

/** Primer problema del producto, escrito para el dueño; null si todo está bien. */
function problem(p: Product): string | null {
    if (!p.name.trim()) return "Escribe el nombre del producto.";
    if (p.variants.length > 1) {
        const i = p.variants.findIndex((v) => !v.label.trim());
        if (i >= 0) return `Escribe el nombre de la variante ${i + 1} (por ejemplo «Simple» o «Doble»).`;
    }
    const ei = extrasOf(p).findIndex((o) => !o.label.trim());
    if (ei >= 0) return `Escribe el nombre del extra ${ei + 1} (por ejemplo «Bebida» o «Papas extras»).`;
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
                            <div className="mt-4 flex flex-col gap-3">
                                <span className="text-sm text-muted-foreground">Sin foto, el producto se muestra sobre este color</span>
                                <ColorPicker label="Color de fondo del producto" value={p.color} onChange={(hex) => set({ color: hex })} />
                            </div>
                        )}
                    </Section>

                    {single ? (
                        <Section title="Precio">
                            <div className="flex flex-col gap-3">
                                <Field label="Precio" hint="En dólares">
                                    <PriceInput value={p.variants[0].price} onChange={(n) => setVariant(0, { price: n })} />
                                </Field>
                                <Button variant="soft" onClick={() => set({ variants: [{ ...p.variants[0], label: "Sencilla" }, { id: uid(), label: "", price: p.variants[0].price }] })}>
                                    <IconAgregar />Tiene variantes (ej.: Doble y Sencilla)
                                </Button>
                            </div>
                        </Section>
                    ) : (
                        <Section title="Variantes">
                            <p className="-mt-1 mb-3 text-sm text-muted-foreground">El cliente elige <b>una</b>. Ej.: Doble $8.00 · Sencilla $5.00.</p>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2 px-1 text-sm font-medium"><span className="flex-1">Nombre</span><span className="w-28">Precio</span><span className="w-12" /></div>
                                {p.variants.map((v, i) => (
                                    <div key={v.id} className="flex items-center gap-2">
                                        <Input aria-label={`Nombre de la variante ${i + 1}`} autoComplete="off" autoCapitalize="sentences" placeholder="Ej.: Doble" value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} />
                                        <PriceInput aria-label={`Precio de ${v.label || `la variante ${i + 1}`}`} className="w-28" value={v.price} onChange={(n) => setVariant(i, { price: n })} />
                                        <IconButton label={`Quitar ${v.label || `variante ${i + 1}`}`} className="shrink-0 text-muted-foreground" onClick={() => set({ variants: p.variants.filter((_, j) => j !== i) })}><IconBorrar /></IconButton>
                                    </div>
                                ))}
                                {p.variants.length < MAX_VARIANTS && (
                                    <Button variant="outline" onClick={() => set({ variants: [...p.variants, { id: uid(), label: "", price: p.variants[p.variants.length - 1].price }] })}><IconAgregar />Agregar variante</Button>
                                )}
                                {p.variants.length === 2 && (
                                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => set({ variants: [{ ...p.variants[0], label: "Único" }] })}>Quitar las variantes y dejar un solo precio</Button>
                                )}
                            </div>
                        </Section>
                    )}

                    <Section title="Extras">
                        {!isSimple(p) ? (
                            <div className="flex flex-col gap-3">
                                <p className="text-sm text-muted-foreground">Este producto usa opciones del formato anterior (varias preguntas). Simplifícalo para editarlo: se juntan todas sus opciones en una sola lista de extras.</p>
                                <Button variant="outline" onClick={() => setP(simplify(p))}>Convertir a extras simples</Button>
                            </div>
                        ) : (
                            <>
                                <p className="-mt-1 mb-3 text-sm text-muted-foreground">Lo que el cliente puede <b>agregar</b>, cada cosa con su precio. Ej.: Bebida $1.00 · Papas extras $2.00. Son opcionales.</p>
                                <div className="flex flex-col gap-3">
                                    {extrasOf(p).length > 0 && (
                                        <div className="flex gap-2 px-1 text-sm font-medium"><span className="flex-1">Nombre</span><span className="w-28">Precio</span><span className="w-12" /></div>
                                    )}
                                    {extrasOf(p).map((o, i) => (
                                        <div key={o.id} className="flex items-center gap-2">
                                            <Input aria-label={`Nombre del extra ${i + 1}`} autoComplete="off" autoCapitalize="sentences" placeholder="Ej.: Bebida" value={o.label}
                                                onChange={(e) => setP(withExtras(p, extrasOf(p).map((x, j) => (j === i ? { ...x, label: e.target.value } : x))))} />
                                            <PriceInput aria-label={`Precio de ${o.label || `el extra ${i + 1}`}`} className="w-28" value={o.price}
                                                onChange={(n) => setP(withExtras(p, extrasOf(p).map((x, j) => (j === i ? { ...x, price: n } : x))))} />
                                            <IconButton label={`Quitar ${o.label || `extra ${i + 1}`}`} className="shrink-0 text-muted-foreground"
                                                onClick={() => setP(withExtras(p, extrasOf(p).filter((_, j) => j !== i)))}><IconBorrar /></IconButton>
                                        </div>
                                    ))}
                                    {extrasOf(p).length < MAX_EXTRAS ? (
                                        <Button variant="outline" onClick={() => setP(withExtras(p, [...extrasOf(p), { id: uid(), label: "", price: 0 }]))}>
                                            <IconAgregar />{extrasOf(p).length === 0 ? "Agregar un extra" : "Agregar otro extra"}
                                        </Button>
                                    ) : (
                                        <p className="text-center text-sm text-muted-foreground">Máximo {MAX_EXTRAS} extras.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </Section>

                    <Section title="Así lo verá tu cliente">
                        <dl className="space-y-2 text-base">
                            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Producto</dt><dd className="text-right font-semibold">{p.name.trim() || "—"}</dd></div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">{single ? "Precio" : "Elige una"}</dt>
                                <dd className="text-right tabular-nums">{single ? `$${p.variants[0].price.toFixed(2)}` : p.variants.map((v) => `${v.label.trim() || "…"} $${v.price.toFixed(2)}`).join(" · ")}</dd>
                            </div>
                            {extrasOf(p).length > 0 && (
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">Puede agregar</dt>
                                    <dd className="text-right tabular-nums">{extrasOf(p).map((o) => `${o.label.trim() || "…"} +$${o.price.toFixed(2)}`).join(" · ")}</dd>
                                </div>
                            )}
                        </dl>
                    </Section>

                    {!isNew && total > 1 && (
                        <Section title="Posición en el menú" action={<span className="text-sm text-muted-foreground">{index + 1} de {total}</span>}>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" disabled={index === 0 || busy} onClick={() => run(() => onMove(p.id, -1))}><IconSubir />Subir</Button>
                                <Button variant="outline" disabled={index === total - 1 || busy} onClick={() => run(() => onMove(p.id, 1))}><IconBajar />Bajar</Button>
                            </div>
                        </Section>
                    )}

                    {!isNew && (
                        <section className="mt-2 rounded-2xl border border-destructive/30 p-4">
                            <h2 className="font-semibold text-destructive">Eliminar producto</h2>
                            {total <= 1 ? (
                                <p className="mt-1 text-sm text-muted-foreground">Tu menú necesita al menos un producto, por eso este no se puede eliminar.</p>
                            ) : askDelete ? (
                                <>
                                    <p className="mt-1 text-sm">¿Eliminar «{p.name || "este producto"}»? Se quita del borrador; si ya lo publicaste, deja de verse al publicar de nuevo.</p>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <Button variant="outline" onClick={() => setAskDelete(false)}>No, conservar</Button>
                                        <Button variant="destructive" disabled={busy} onClick={() => run(() => onDelete(p.id))}>Sí, eliminar</Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="mt-1 text-sm text-muted-foreground">Esta acción quita el producto de tu menú.</p>
                                    <Button variant="outline" className="mt-3 w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive" disabled={busy} onClick={() => setAskDelete(true)}>
                                        <IconBorrar />Eliminar producto
                                    </Button>
                                </>
                            )}
                        </section>
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
                    ) : (
                        <>
                            {err && <p role="alert" className="text-center text-sm text-destructive">{err}</p>}
                            <Button size="lg" disabled={busy || uploading || !!err || (!isNew && !dirty)} onClick={() => run(() => onSave(p))}>
                                {busy ? "Guardando…" : isNew ? "Agregar al menú" : dirty ? "Guardar cambios" : "Sin cambios"}
                            </Button>
                        </>
                    )}
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
