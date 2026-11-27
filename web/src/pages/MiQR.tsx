import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import qrcode from "qrcode-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/components/panel/PanelLayout";

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

    function add() {
        const src = slugify(draft);
        if (!SRC_RE.test(src)) return;
        const next = places.includes(src) ? places : [...places, src];
        setPlaces(next);
        localStorage.setItem(STORAGE, JSON.stringify(next));
        setCurrent(src);
        setDraft("");
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
            <Link to="/cuenta" className="mb-2 inline-block text-sm text-muted-foreground">← Cuenta</Link>
            <h1 className="mb-1 text-2xl font-bold">Mi QR</h1>
            <p className="mb-4 text-sm text-muted-foreground">
                Crea un QR por lugar (terminal, colegio, parque…) y verás cuántos pedidos llegan de cada uno.
            </p>

            <div className="mb-4 flex gap-2">
                <div className="flex-1">
                    <Label htmlFor="lugar" className="sr-only">Lugar</Label>
                    <Input id="lugar" className="h-12" placeholder="Nombre del lugar" value={draft}
                        onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
                </div>
                <Button className="h-12" disabled={!SRC_RE.test(slugify(draft))} onClick={add}>Crear</Button>
            </div>

            {places.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {places.map((p) => (
                        <Button key={p} size="sm" className="h-10" variant={p === current ? "default" : "outline"} onClick={() => setCurrent(p)}>{p}</Button>
                    ))}
                </div>
            )}

            {url ? (
                <>
                    <div className="mb-3 rounded-2xl border bg-white p-4" dangerouslySetInnerHTML={{ __html: svg }} />
                    <p className="mb-4 break-all text-center text-xs text-muted-foreground">{url}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="h-12 flex-1" onClick={download}>Descargar SVG</Button>
                        <Button className="h-12 flex-1" onClick={() => window.print()}>Imprimir cartel</Button>
                    </div>

                    {/* Cartel: solo se ve al imprimir (A5 o A6, spec §12.6). */}
                    <div id="poster" className="hidden">
                        <h1>{store.name}</h1>
                        <div className="poster-qr" dangerouslySetInnerHTML={{ __html: svg }} />
                        <p>Escanea y pide</p>
                        <small>llega a tu WhatsApp</small>
                    </div>
                </>
            ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">Escribe un lugar para crear tu primer QR.</p>
            )}
        </>
    );
}
