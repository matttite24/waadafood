import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import qrcode from "qrcode-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useStore } from "@/components/panel/PanelLayout";
import { Empty, Section } from "@/components/panel/kit";
import { IconAgregar, IconAtras, IconBorrar, IconDescargar, IconImprimir, IconQr } from "@/components/icons";

const STORAGE = "waada-qr-lugares";
const SRC_RE = /^[a-z0-9-]{2,30}$/;

const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);

function loadPlaces(): string[] {
    try {
        const v = JSON.parse(localStorage.getItem(STORAGE) ?? "[]");
        return Array.isArray(v) ? v.filter((x) => typeof x === "string" && SRC_RE.test(x)) : [];
    } catch {
        return [];
    }
}

/** QR en SVG, generado en el navegador (spec §12.6). */
function qrSvg(text: string): string {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
}

export default function MiQR() {
    const store = useStore();
    const [places, setPlaces] = useState<string[]>(loadPlaces);
    const [draft, setDraft] = useState("");
    const [current, setCurrent] = useState<string | null>(places[0] ?? null);

    const url = current ? `https://waadafood.com/${store.slug}?src=${current}` : null;
    const svg = useMemo(() => (url ? qrSvg(url) : ""), [url]);
    const candidate = slugify(draft);

    function persist(next: string[]) {
        setPlaces(next);
        try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch { /* sin almacenamiento */ }
    }

    function add() {
        if (!SRC_RE.test(candidate)) return;
        persist(places.includes(candidate) ? places : [...places, candidate]);
        setCurrent(candidate);
        setDraft("");
    }

    function remove() {
        if (!current) return;
        const next = places.filter((p) => p !== current);
        persist(next);
        setCurrent(next[0] ?? null);
    }

    function download() {
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `qr-${store.slug}-${current}.svg`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    return (
        <>
            <Link to="/cuenta" className="mb-2 inline-flex min-h-12 items-center gap-1.5 text-base text-muted-foreground"><IconAtras />Cuenta</Link>
            <h1 className="mb-1 text-2xl font-bold">Mi QR</h1>
            <p className="mb-4 text-base text-muted-foreground">Crea un QR por lugar (terminal, colegio, parque…) y verás cuántos pedidos llegan de cada uno.</p>

            <form className="mb-4 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
                <Field label="Nuevo lugar" className="flex-1" hint={draft && candidate ? `Se guardará como «${candidate}»` : undefined}>
                    <Input autoComplete="off" autoCapitalize="none" enterKeyHint="done" placeholder="Ej.: Terminal" value={draft} onChange={(e) => setDraft(e.target.value)} />
                </Field>
                <Button type="submit" className="mb-[26px]" disabled={!SRC_RE.test(candidate)} aria-label="Crear QR"><IconAgregar />Crear</Button>
            </form>

            {places.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Lugares">
                    {places.map((p) => (
                        <Button key={p} role="tab" aria-selected={p === current} size="sm" variant={p === current ? "default" : "outline"} onClick={() => setCurrent(p)}>{p}</Button>
                    ))}
                </div>
            )}

            {url ? (
                <Section>
                    <div className="rounded-xl border bg-white p-4" dangerouslySetInnerHTML={{ __html: svg }} />
                    <p className="my-3 break-all text-center text-sm text-muted-foreground">{url}</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={download}><IconDescargar />Descargar</Button>
                        <Button onClick={() => window.print()}><IconImprimir />Imprimir cartel</Button>
                    </div>
                    <Button variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={remove}><IconBorrar />Eliminar este lugar de la lista</Button>

                    {/* Cartel: solo se ve al imprimir (A5 o A6, spec §12.6). */}
                    <div id="poster" className="hidden">
                        <h1>{store.name}</h1>
                        <div className="poster-qr" dangerouslySetInnerHTML={{ __html: svg }} />
                        <p>Escanea y pide</p>
                        <small>llega a tu WhatsApp</small>
                    </div>
                </Section>
            ) : (
                <Empty icon={<IconQr />} title="Crea tu primer QR" text="Escribe el nombre del lugar donde lo vas a pegar y pulsa Crear." />
            )}
        </>
    );
}
