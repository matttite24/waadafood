import { useState, useEffect } from "preact/hooks";
import { Kiosko, safeColor } from "../src/components/Kiosko";
import type { Menu, Product } from "../../shared/types";
import { money, productTotal, deliveryFee, variantOf, type Selection } from "../../shared/price";
import { buildMessage, orderTotal, waLink } from "../../shared/message";

/** Estado del flujo. Es serializable para guardarlo en el historial y que "atrás" funcione. */
interface Flow {
    step: "home" | "variant" | "group" | "checkout" | "sent";
    pid?: string;
    variantId?: string;
    picks: Record<string, string[]>;
    gi: number;
    code?: string;
}

const HOME: Flow = { step: "home", picks: {}, gi: 0 };
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function newCode(): string {
    const b = crypto.getRandomValues(new Uint8Array(4));
    return Array.from(b, (x) => CODE_ALPHABET[x % CODE_ALPHABET.length]).join("");
}

function sessionId(): string {
    try {
        let id = sessionStorage.getItem("sid");
        if (!id) sessionStorage.setItem("sid", (id = crypto.randomUUID()));
        return id;
    } catch {
        return crypto.randomUUID();
    }
}

interface Props { menu: Menu; open: boolean; preview: boolean }

export function App({ menu, open, preview }: Props) {
    const [flow, setFlow] = useState<Flow>(HOME);

    useEffect(() => {
        history.replaceState(HOME, "");
        const onPop = (e: PopStateEvent) => setFlow((e.state as Flow | null) ?? HOME);
        addEventListener("popstate", onPop);
        return () => removeEventListener("popstate", onPop);
    }, []);

    const go = (next: Flow) => { history.pushState(next, ""); setFlow(next); };
    const patch = (next: Flow) => { history.replaceState(next, ""); setFlow(next); };

    const product = menu.products.find((p) => p.id === flow.pid);
    const sel: Selection = { variantId: flow.variantId ?? product?.variants[0].id ?? "", picks: flow.picks };

    const afterVariant = (p: Product, variantId: string, picks: Flow["picks"]): Flow =>
        p.groups.length > 0
            ? { step: "group", pid: p.id, variantId, picks, gi: 0 }
            : { step: "checkout", pid: p.id, variantId, picks, gi: 0, code: newCode() };

    function pick(p: Product) {
        if (p.variants.length > 1) go({ step: "variant", pid: p.id, picks: {}, gi: 0 });
        else go(afterVariant(p, p.variants[0].id, {}));
    }

    const brand = safeColor(menu.store.color, "#C8321F");

    if (flow.step === "home" || !product) {
        return <Kiosko menu={menu} open={open} onPick={pick} />;
    }

    const shell = (title: string, body: preact.ComponentChildren, bar: preact.ComponentChildren) => (
        <div class="k flow" style={`--brand:${brand}`}>
            <header class="fhead">
                <button type="button" class="back" aria-label="Atrás" onClick={() => history.back()}>‹</button>
                <span>{menu.store.name}</span>
            </header>
            <main class="fbody">
                <h2>{title}</h2>
                {body}
            </main>
            <footer class="fbar">{bar}</footer>
        </div>
    );

    const total = productTotal(product, sel);

    if (flow.step === "variant") {
        return shell(
            `${product.name}: ¿cuál?`,
            product.variants.map((v) => (
                <button type="button" class="opt" onClick={() => go(afterVariant(product, v.id, {}))}>
                    <span><b>{v.label}</b>{v.note && <small>{v.note}</small>}</span>
                    <span class="num">{money(v.price)}</span>
                </button>
            )),
            <div class="total"><span>{product.name}</span><span class="num">Desde {money(Math.min(...product.variants.map((v) => v.price)))}</span></div>,
        );
    }

    if (flow.step === "group") {
        const g = product.groups[flow.gi];
        const chosen = flow.picks[g.id] ?? [];
        const advance = (picks: Flow["picks"]) => {
            const gi = flow.gi + 1;
            if (gi < product.groups.length) go({ ...flow, picks, gi });
            else go({ step: "checkout", pid: product.id, variantId: flow.variantId, picks, gi: 0, code: newCode() });
        };
        if (g.type === "one") {
            return shell(
                g.title || "Elige una opción",
                g.options.map((o) => (
                    <button type="button" class="opt" onClick={() => advance({ ...flow.picks, [g.id]: [o.id] })}>
                        <b>{o.label}</b><span class="num">{o.price > 0 ? `+${money(o.price)}` : ""}</span>
                    </button>
                )),
                <div class="total"><span>Total</span><span class="num">{money(total)}</span></div>,
            );
        }
        const toggle = (id: string) => {
            const on = chosen.includes(id);
            if (!on && g.max && chosen.length >= g.max) return;
            patch({ ...flow, picks: { ...flow.picks, [g.id]: on ? chosen.filter((x) => x !== id) : [...chosen, id] } });
        };
        return shell(
            g.title || "¿Le agregamos algo?",
            <div class="chips">
                {g.options.map((o) => (
                    <button type="button" class={chosen.includes(o.id) ? "chip on" : "chip"} aria-pressed={chosen.includes(o.id)} onClick={() => toggle(o.id)}>
                        {g.prefix ? `${g.prefix} ` : ""}{o.label}{o.price > 0 && <small> +{money(o.price)}</small>}
                    </button>
                ))}
            </div>,
            <button type="button" class="cta" onClick={() => advance(flow.picks)}>
                {chosen.length === 0 ? "Continuar sin cambios" : `Siguiente · ${money(total)}`}
            </button>,
        );
    }

    if (flow.step === "checkout") {
        return <Checkout menu={menu} product={product} sel={sel} code={flow.code ?? newCode()} preview={preview} brand={brand}
            onBack={() => history.back()} onSent={() => patch({ ...flow, step: "sent" })} />;
    }

    // step === "sent"
    return <Sent menu={menu} product={product} sel={sel} code={flow.code ?? ""} brand={brand} onAgain={() => go(HOME)} />;
}

/* ───────────────────────── Datos con ubicación ───────────────────────── */

interface Geo { lat: number; lng: number; accuracy: number }

function Checkout(props: {
    menu: Menu; product: Product; sel: Selection; code: string; preview: boolean; brand: string; onBack: () => void; onSent: () => void;
}) {
    const { menu, product, sel, code, preview, brand } = props;
    const { store } = menu;
    const [mode, setMode] = useState<"domicilio" | "retiro">(store.delivery.enabled ? "domicilio" : "retiro");
    const [name, setName] = useState("");
    const [reference, setReference] = useState("");
    const [payment, setPayment] = useState<"efectivo" | "transferencia">(store.payments[0]);
    const [cash, setCash] = useState("");
    const [geo, setGeo] = useState<Geo | null>(null);
    const [geoMsg, setGeoMsg] = useState("");
    const [locating, setLocating] = useState(false);

    const cashAmount = parseFloat(cash.replace(",", ".")) || undefined;
    const input = { code, store, product, sel, mode, name, lat: geo?.lat, lng: geo?.lng, reference, payment, cashAmount };
    const total = orderTotal(input);
    const fee = deliveryFee(mode, store.delivery.fee);

    const valid = name.trim().length >= 2 && (mode === "retiro" || !!geo || reference.trim().length > 5);

    function locate() {
        if (!navigator.geolocation) { setGeoMsg("Tu navegador no permite ubicación. Escribe una referencia."); return; }
        setLocating(true);
        setGeoMsg("");
        navigator.geolocation.getCurrentPosition(
            (p) => { setLocating(false); setGeo({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }); },
            () => { setLocating(false); setGeoMsg("No pudimos obtener tu ubicación. Escribe una referencia."); },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }

    function onSend(e: MouseEvent) {
        if (!valid) { e.preventDefault(); return; }
        if (!preview) {
            // Aviso al servidor sin bloquear la apertura de WhatsApp (el enlace sigue su curso normal).
            const payload = {
                sessionId: sessionId(), code, slug: store.slug, productId: product.id, variantId: sel.variantId, picks: sel.picks,
                mode, name: name.trim(), lat: geo?.lat, lng: geo?.lng, accuracy: geo?.accuracy,
                reference: reference.trim() || undefined, payment, cashAmount, clientTotal: total,
                src: new URLSearchParams(location.search).get("src") ?? undefined,
            };
            try { navigator.sendBeacon("/api/pedido", new Blob([JSON.stringify(payload)], { type: "application/json" })); } catch { /* sin red: igual abre WhatsApp */ }
        }
        setTimeout(props.onSent, 400);
    }

    const href = waLink(store.phone, buildMessage(input));
    const v = variantOf(product, sel);

    return (
        <div class="k flow" style={`--brand:${brand}`}>
            <header class="fhead">
                <button type="button" class="back" aria-label="Atrás" onClick={props.onBack}>‹</button>
                <span>{store.name}</span>
            </header>
            <main class="fbody">
                <h2>Tus datos</h2>
                <p class="sum">1× {product.name}{product.variants.length > 1 ? ` · ${v.label}` : ""} — <span class="num">{money(productTotal(product, sel))}</span></p>

                <div class="seg" role="group" aria-label="Entrega">
                    {store.delivery.enabled && <button type="button" class={mode === "domicilio" ? "on" : ""} onClick={() => setMode("domicilio")}>A domicilio</button>}
                    {store.delivery.pickup && <button type="button" class={mode === "retiro" ? "on" : ""} onClick={() => setMode("retiro")}>Retiro en local</button>}
                </div>

                {mode === "domicilio" && (
                    <section class="field">
                        <button type="button" class="opt" onClick={locate} disabled={locating}>
                            <b>{locating ? "Buscando tu ubicación…" : geo ? "Ubicación lista ✓" : "Usar mi ubicación"}</b>
                            {geo && <span class="num">±{Math.round(geo.accuracy)} m</span>}
                        </button>
                        {geoMsg && <p class="err">{geoMsg}</p>}
                        <label>
                            Referencia {geo ? "(opcional)" : "(obligatoria)"}
                            <input value={reference} onInput={(e) => setReference((e.target as HTMLInputElement).value)} placeholder="Casa verde frente a la cancha" autocomplete="street-address" />
                        </label>
                        {store.delivery.note && <p class="note">{store.delivery.note}</p>}
                    </section>
                )}

                <label class="field">
                    Tu nombre
                    <input value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} autocomplete="name" />
                </label>

                <div class="seg" role="group" aria-label="Pago">
                    {store.payments.map((p) => (
                        <button type="button" class={payment === p ? "on" : ""} onClick={() => setPayment(p)}>{p === "efectivo" ? "Efectivo" : "Transferencia"}</button>
                    ))}
                </div>
                {payment === "efectivo" && (
                    <label class="field">
                        ¿Con cuánto pagas? (opcional)
                        <input value={cash} inputMode="decimal" onInput={(e) => setCash((e.target as HTMLInputElement).value)} placeholder="20" />
                    </label>
                )}
                {fee > 0 && <p class="note">Incluye envío de {money(fee)}</p>}
            </main>
            <footer class="fbar">
                <a class={valid ? "cta wa" : "cta wa off"} href={valid ? href : undefined} aria-disabled={!valid} onClick={onSend as unknown as (e: Event) => void}>
                    Enviar por WhatsApp · <span class="num">{money(total)}</span>
                </a>
            </footer>
        </div>
    );
}

/* ───────────────────────── Pedido enviado ───────────────────────── */

function Sent({ menu, product, sel, code, brand, onAgain }: { menu: Menu; product: Product; sel: Selection; code: string; brand: string; onAgain: () => void }) {
    const phone = menu.store.phone;
    return (
        <div class="k flow" style={`--brand:${brand}`}>
            <header class="fhead"><span>{menu.store.name}</span></header>
            <main class="fbody center">
                <h2>Pedido #{code} listo</h2>
                <p>Se abrió WhatsApp con tu pedido. Solo falta que pulses <b>Enviar</b> allí.</p>
                <p class="note">¿No se abrió? Escríbenos al <b class="num">+{phone}</b> con el código #{code}.</p>
                <p class="sum">{product.name} — <span class="num">{money(productTotal(product, sel))}</span></p>
            </main>
            <footer class="fbar">
                <button type="button" class="cta" onClick={onAgain}>Hacer otro pedido</button>
            </footer>
        </div>
    );
}
