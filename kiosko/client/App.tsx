import { useState, useEffect, useRef } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { Kiosko, safeColor, ink } from "../src/components/Kiosko";
import type { Menu, Product } from "../../shared/types";
import { money, productTotal, deliveryFee, optionsOf, variantOf, type Selection } from "../../shared/price";
import { buildMessage, orderTotal, waLink, type OrderInput } from "../../shared/message";

/**
 * Flujo de compra (un producto por pedido), una decisión por pantalla:
 *   producto → variantes → extras → dónde → nombre → pago → WhatsApp
 * Las pantallas sin nada que elegir se saltan solas. El estado es serializable para que "atrás" funcione.
 */
interface Flow {
    step: "home" | "variant" | "group" | "where" | "name" | "pay" | "sent";
    pid?: string;
    variantId?: string;
    picks: Record<string, string[]>;
    gi: number;
    code?: string;
    mode?: "domicilio" | "retiro";
    geo?: { lat: number; lng: number; acc: number };
    ref?: string;
    name?: string;
    payment?: "efectivo" | "transferencia";
}

const HOME: Flow = { step: "home", picks: {}, gi: 0 };
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
// Nombres de ejemplo que van rotando en el campo: una invitación a escribir el propio.
const NAMES = ["Juan", "María", "Diego", "Sofía", "Miguel", "Camila", "Carlos", "Valeria", "Mateo", "Ana", "Luis", "Daniela", "Andrés", "Paola", "José", "Lucía"];

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

/** En el iPhone el teclado tapa la página en vez de achicarla: se ajusta la pantalla al área visible para que el botón no quede escondido. */
function useVisibleViewport(active: boolean) {
    useEffect(() => {
        const vv = window.visualViewport;
        if (!active || !vv) return;
        const root = document.documentElement.style;
        const set = () => { root.setProperty("--vvh", `${vv.height}px`); root.setProperty("--vvt", `${vv.offsetTop}px`); };
        set();
        vv.addEventListener("resize", set);
        vv.addEventListener("scroll", set);
        return () => {
            vv.removeEventListener("resize", set);
            vv.removeEventListener("scroll", set);
            root.removeProperty("--vvh");
            root.removeProperty("--vvt");
        };
    }, [active]);
}

interface Props { menu: Menu; open: boolean; preview: boolean }

export function App({ menu, open, preview }: Props) {
    const [flow, setFlow] = useState<Flow>(HOME);
    const { store } = menu;

    useEffect(() => {
        history.replaceState(HOME, "");
        const onPop = (e: PopStateEvent) => setFlow((e.state as Flow | null) ?? HOME);
        addEventListener("popstate", onPop);
        return () => removeEventListener("popstate", onPop);
    }, []);
    useVisibleViewport(flow.step !== "home");

    const go = (next: Flow) => { history.pushState(next, ""); setFlow(next); };
    const patch = (next: Flow) => { history.replaceState(next, ""); setFlow(next); };

    const product = menu.products.find((p) => p.id === flow.pid);
    const sel: Selection = { variantId: flow.variantId ?? product?.variants[0].id ?? "", picks: flow.picks };

    /** Tras variantes y extras: si no hay domicilio, no hay nada que preguntar sobre ubicación. */
    const toWhere = (f: Flow): Flow => (store.delivery.enabled ? { ...f, step: "where" } : { ...f, step: "name", mode: "retiro" });
    const afterVariant = (p: Product, variantId: string, f: Flow): Flow =>
        p.groups.length > 0 ? { ...f, step: "group", variantId, gi: 0 } : toWhere({ ...f, variantId });

    function pick(p: Product) {
        const base: Flow = { step: "variant", pid: p.id, picks: {}, gi: 0, code: newCode() };
        go(p.variants.length > 1 ? base : afterVariant(p, p.variants[0].id, base));
    }

    if (flow.step === "home" || !product) return <Kiosko menu={menu} open={open} onPick={pick} />;

    // Fondo de las pantallas del flujo: siempre el color de la marca.
    const bg = safeColor(store.color, "#C8321F");
    const mode = flow.mode ?? "retiro";
    const total = Math.round((productTotal(product, sel) + deliveryFee(flow.mode ?? "retiro", store.delivery.fee)) * 100) / 100;

    const extrasText = optionsOf(product, sel).map((x) => x.option.label).join(", ");
    const variantText = product.variants.length > 1 ? variantOf(product, sel).label : "";
    const shell = (title: string, body: ComponentChildren, footer?: ComponentChildren) => (
        <Shell bg={bg} onBack={() => history.back()} name={product.name} detail={[variantText, extrasText].filter(Boolean).join(" · ")} total={money(total)} title={title} footer={footer}>
            {body}
        </Shell>
    );

    if (flow.step === "variant") {
        return shell(
            "¿Cuál prefieres?",
            product.variants.map((v) => (
                <button type="button" class="opt2" onClick={() => go(afterVariant(product, v.id, { ...flow }))}>
                    <span>{v.label}{v.note && <small>{v.note}</small>}</span>
                    <span class="num">{money(v.price)}</span>
                </button>
            )),
        );
    }

    if (flow.step === "group") {
        const g = product.groups[flow.gi];
        const chosen = flow.picks[g.id] ?? [];
        const advance = (picks: Flow["picks"]) => {
            const gi = flow.gi + 1;
            go(gi < product.groups.length ? { ...flow, picks, gi } : toWhere({ ...flow, picks }));
        };
        if (g.type === "one") {
            return shell(g.title || "Elige una opción", g.options.map((o) => (
                <button type="button" class="opt2" onClick={() => advance({ ...flow.picks, [g.id]: [o.id] })}>
                    <span>{o.label}</span><span class="num">{o.price > 0 ? `+${money(o.price)}` : ""}</span>
                </button>
            )));
        }
        const toggle = (id: string) => {
            const on = chosen.includes(id);
            if (!on && g.max && chosen.length >= g.max) return;
            patch({ ...flow, picks: { ...flow.picks, [g.id]: on ? chosen.filter((x) => x !== id) : [...chosen, id] } });
        };
        return shell(
            g.title || "¿Quieres agregar algo?",
            <>
                <div class="chips2">
                    {g.options.map((o) => (
                        <button type="button" class={chosen.includes(o.id) ? "chip2 on" : "chip2"} aria-pressed={chosen.includes(o.id)} onClick={() => toggle(o.id)}>
                            {g.prefix ? `${g.prefix} ` : ""}{o.label}{o.price > 0 && <small> +{money(o.price)}</small>}
                        </button>
                    ))}
                </div>
                <div class="sep" />
                {/* Siempre hay una respuesta explícita: elegir extras o «Sin extras». No se puede avanzar sin decidir. */}
                <button type="button" class="opt2" onClick={() => advance({ ...flow.picks, [g.id]: [] })}><span>Sin extras</span></button>
            </>,
            chosen.length > 0 ? <button type="button" class="cta2" onClick={() => advance(flow.picks)}>{`Agregar y continuar · ${money(total)}`}</button> : undefined,
        );
    }

    if (flow.step === "where") return shell("¿Dónde te lo llevamos?", <Where flow={flow} store={store} onNext={go} onPatch={patch} />);
    if (flow.step === "name") return shell("¿Tu nombre es…?", <Name flow={flow} onNext={go} />);

    if (flow.step === "pay") {
        return shell("¿Cómo pagas?", <Pay flow={flow} menu={menu} product={product} sel={sel} preview={preview}
            onSent={() => patch({ ...flow, step: "sent" })} />);
    }

    // step === "sent"
    return (
        <Shell bg={bg} name={product.name} detail="" total={money(total)} title={`Pedido #${flow.code} listo`}
            footer={<>
                <button type="button" class="cta2" onClick={() => go(HOME)}>Hacer otro pedido</button>
                <a class="promo" href={`https://waadafood.com/?ref=${encodeURIComponent(store.slug)}`}>Pide con Waada · ¿Tienes restaurante? Recibe pedidos así →</a>
            </>}>
            <p>Se abrió WhatsApp con tu pedido. Solo falta que pulses <b>Enviar</b> allí.</p>
            <p class="note2">¿No se abrió? Escríbenos al <b class="num">+{store.phone}</b> con el código #{flow.code}.</p>
        </Shell>
    );
}

/* ───────────────────────── Estructura común ───────────────────────── */

function Shell(p: {
    bg: string; name: string; detail: string; total: string; title: string; children: ComponentChildren;
    footer?: ComponentChildren; onBack?: () => void;
}) {
    return (
        <div class="k flow" style={`--bg:${p.bg};--ink:${ink(p.bg)}`}>
            <header class="top2">
                {p.onBack ? <button type="button" class="back" aria-label="Atrás" onClick={p.onBack}>‹</button> : <span class="back" />}
                <div class="sum"><b>{p.name}</b>{p.detail && <small>{p.detail}</small>}</div>
                <span class="tot num">{p.total}</span>
            </header>
            <main class="fbody">
                <div class="mid">
                    <h2>{p.title}</h2>
                    {p.children}
                </div>
            </main>
            {p.footer && <footer class="fbar">{p.footer}</footer>}
        </div>
    );
}

/* ───────────────────────── 4. Dónde ───────────────────────── */

function Where({ flow, store, onNext, onPatch }: { flow: Flow; store: Menu["store"]; onNext: (f: Flow) => void; onPatch: (f: Flow) => void }) {
    const [view, setView] = useState<"choose" | "delivery">(flow.mode === "domicilio" ? "delivery" : "choose");
    const [geo, setGeo] = useState(flow.geo);
    const [ref, setRef] = useState(flow.ref ?? "");
    const [msg, setMsg] = useState("");
    const [locating, setLocating] = useState(false);

    /** Al elegir domicilio, el envío se suma al total de inmediato (no al pasar a la siguiente pantalla). */
    function enterDelivery() {
        setView("delivery");
        onPatch({ ...flow, mode: "domicilio" });
    }

    function locate() {
        enterDelivery();
        if (!navigator.geolocation) { setMsg("Tu navegador no permite ubicación. Escribe tu dirección."); return; }
        setLocating(true);
        setMsg("");
        navigator.geolocation.getCurrentPosition(
            (p) => { setLocating(false); const g = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }; setGeo(g); onPatch({ ...flow, mode: "domicilio", geo: g }); },
            () => { setLocating(false); setMsg("No pudimos obtener tu ubicación. Escribe tu dirección."); },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }

    if (view === "choose") {
        return (
            <>
                <button type="button" class="opt2" onClick={locate}><span>Enviar mi ubicación<small>Te lo llevamos a donde estás</small></span></button>
                {store.delivery.pickup && (
                    <button type="button" class="opt2" onClick={() => onNext({ ...flow, step: "name", mode: "retiro", geo: undefined, ref: undefined })}>
                        <span>Retiro en el local<small>Pasas a recogerlo</small></span>
                    </button>
                )}
                <button type="button" class="note2 linkbtn" onClick={enterDelivery}>Prefiero escribir mi dirección</button>
                {store.delivery.note && <p class="note2">{store.delivery.note}</p>}
            </>
        );
    }

    const ok = !!geo || ref.trim().length > 5;
    return (
        <>
            {locating && <p class="note2">Buscando tu ubicación…</p>}
            {geo && <p class="note2">✓ Ubicación lista (±{Math.round(geo.acc)} m)</p>}
            {msg && <p class="err2">{msg}</p>}
            {!geo && !locating && <button type="button" class="opt2" onClick={locate}><span>Enviar mi ubicación</span></button>}
            <input class="in2" value={ref} onInput={(e) => setRef((e.target as HTMLInputElement).value)} enterKeyHint="next" autocomplete="street-address"
                placeholder={geo ? "Referencia (opcional)" : "Tu dirección o referencia"} aria-label="Referencia de entrega" />
            {store.delivery.note && <p class="note2">{store.delivery.note}</p>}
            <button type="button" class="cta2 inline" disabled={!ok} onClick={() => onNext({ ...flow, step: "name", mode: "domicilio", geo, ref: ref.trim() || undefined })}>Siguiente</button>
        </>
    );
}

/* ───────────────────────── 5. Nombre ───────────────────────── */

function Name({ flow, onNext }: { flow: Flow; onNext: (f: Flow) => void }) {
    const [name, setName] = useState(flow.name ?? "");
    const [i, setI] = useState(0);
    const order = useRef(NAMES.slice().sort(() => Math.random() - 0.5));
    const input = useRef<HTMLInputElement>(null);

    // Mientras no escriba, el ejemplo va cambiando: "Juan… María… Diego…". Se detiene al escribir.
    useEffect(() => {
        if (name || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const t = setInterval(() => setI((n) => (n + 1) % order.current.length), 1400);
        return () => clearInterval(t);
    }, [name]);
    useEffect(() => { input.current?.focus(); }, []);

    const ok = name.trim().length >= 2;
    const submit = (e?: Event) => { e?.preventDefault(); if (ok) onNext({ ...flow, step: "pay", name: name.trim() }); };

    return (
        <form onSubmit={submit} class="stack">
            <input ref={input} class="in2" value={name} maxLength={40} autocomplete="given-name" autocapitalize="words" enterKeyHint="next"
                placeholder={`${order.current[i]}…`} aria-label="Tu nombre" onInput={(e) => setName((e.target as HTMLInputElement).value)} />
            <p class="note2">Escribe el tuyo para saber a quién entregarle el pedido.</p>
            <button type="submit" class="cta2 inline" disabled={!ok}>Siguiente</button>
        </form>
    );
}

/* ───────────────────────── 6. Pago y envío ───────────────────────── */

function Pay({ flow, menu, product, sel, preview, onSent }: {
    flow: Flow; menu: Menu; product: Product; sel: Selection; preview: boolean; onSent: () => void;
}) {
    const { store } = menu;
    const [payment, setPayment] = useState<Flow["payment"]>(flow.payment ?? (store.payments.length === 1 ? store.payments[0] : undefined));

    const input: OrderInput = {
        code: flow.code ?? newCode(), store, product, sel, mode: flow.mode ?? "retiro", name: flow.name ?? "",
        lat: flow.geo?.lat, lng: flow.geo?.lng, reference: flow.ref, payment: payment ?? store.payments[0],
    };
    const total = orderTotal(input);
    const valid = !!payment;

    function onSend(e: MouseEvent) {
        if (!valid) { e.preventDefault(); return; }
        if (!preview) {
            // Aviso al servidor sin bloquear la apertura de WhatsApp (el enlace sigue su curso normal).
            const payload = {
                sessionId: sessionId(), code: input.code, slug: store.slug, productId: product.id, variantId: sel.variantId, picks: sel.picks,
                mode: input.mode, name: input.name, lat: flow.geo?.lat, lng: flow.geo?.lng, accuracy: flow.geo?.acc,
                reference: flow.ref, payment, clientTotal: total,
                src: new URLSearchParams(location.search).get("src") ?? undefined,
            };
            try { navigator.sendBeacon("/api/pedido", new Blob([JSON.stringify(payload)], { type: "application/json" })); } catch { /* sin red: igual abre WhatsApp */ }
        }
        setTimeout(onSent, 400);
    }

    return (
        <>
            {store.payments.length > 1 && store.payments.map((p) => (
                <button type="button" class={payment === p ? "opt2 on" : "opt2"} aria-pressed={payment === p} onClick={() => setPayment(p)}>
                    <span>{p === "efectivo" ? "Efectivo" : "Transferencia"}</span>
                </button>
            ))}
            {store.payments.length === 1 && <p class="note2">Pagas con {store.payments[0]}.</p>}
            <a class={valid ? "cta2 wa inline" : "cta2 wa inline off"} href={valid ? waLink(store.phone, buildMessage(input)) : undefined} aria-disabled={!valid} onClick={onSend as unknown as (e: Event) => void}>
                Enviar por WhatsApp · <span class="num">{money(total)}</span>
            </a>
        </>
    );
}
