import type { Menu, Product } from "../../../shared/types";

const money = (n: number) => `$${n.toFixed(2)}`;

const HEX = /^#[0-9a-fA-F]{6}$/;
export const safeColor = (c: string, fallback = "#F4C542") => (HEX.test(c) ? c : fallback);

/** Texto oscuro o claro según la luminosidad del fondo (contraste legible con cualquier color de marca). */
function ink(bg: string): string {
    const n = parseInt(safeColor(bg).slice(1), 16);
    const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.6 ? "#1a1412" : "#ffffff";
}

const SIZES = "(max-width:520px) 100vw, 520px";
export const imgSrcset = (key: string, widths: number[]) => widths.map((w) => `/i/${key}-${w}.webp ${w}w`).join(", ");
const IMG_KEY = /^[a-z0-9]+\/[a-f0-9]{10}$/;
const LQIP = /^data:image\/webp;base64,[A-Za-z0-9+/=]{1,2000}$/;

function Photo({ p, first }: { p: Product; first: boolean }) {
    const im = p.image;
    if (!im || !IMG_KEY.test(im.key)) return null;
    const widths = im.widths.filter((w) => w === 480 || w === 720 || w === 1080);
    if (widths.length === 0) return null;
    const bg = LQIP.test(im.lqip) ? `background-image:url(${im.lqip})` : "";
    return (
        <div class="photo" style={bg}>
            <img
                src={`/i/${im.key}-${widths.includes(720) ? 720 : widths[0]}.webp`}
                srcset={imgSrcset(im.key, widths)}
                sizes={SIZES}
                width={im.w}
                height={im.h}
                alt={p.name}
                loading={first ? "eager" : "lazy"}
                decoding="async"
                fetchpriority={first ? "high" : "auto"}
            />
        </div>
    );
}

function Slide({ p, open, i, n, onPick }: { p: Product; open: boolean; i: number; n: number; onPick?: (p: Product) => void }) {
    const bg = safeColor(p.color);
    const from = Math.min(...p.variants.map((v) => v.price));
    const canOrder = open && p.available;
    const prev = i > 0 ? `#p-${i - 1}` : null;
    const next = i < n - 1 ? `#p-${i + 1}` : null;
    return (
        <section id={`p-${i}`} class={p.image ? "slide has-img" : "slide"} data-product={p.id} style={p.image ? `background:${bg}` : `background:${bg};color:${ink(bg)}`}>
            <Photo p={p} first={i === 0} />
            <div class="top">
                {prev ? <a class="arrow" href={prev} aria-label="Anterior">‹</a> : <span class="arrow off" />}
                {n > 1 && <span class="dots" aria-hidden="true">{Array.from({ length: n }, (_, j) => (j === i ? "●" : "○")).join(" ")}</span>}
                {next ? <a class="arrow" href={next} aria-label="Siguiente">›</a> : <span class="arrow off" />}
            </div>
            <div class="body">
                {p.tag && <span class="tag">{p.tag}</span>}
                <h1>{p.name}</h1>
                {p.desc && <p class="desc">{p.desc}</p>}
                <strong class="from">Desde {money(from)}</strong>
            </div>
            <button class="cta" type="button" data-pick={p.id} disabled={!canOrder} onClick={() => onPick?.(p)}>
                {!open ? "Cerrado ahora" : p.available ? "Lo quiero" : "Agotado"}
            </button>
        </section>
    );
}

/** Pantalla de inicio del kiosko: carrusel con scroll-snap que funciona sin JavaScript (flechas con anclas). */
export function Kiosko({ menu, open, onPick }: { menu: Menu; open: boolean; onPick?: (p: Product) => void }) {
    const { store, products } = menu;
    return (
        <div class="k">
            <header class="bar">
                <span class="name">{store.name}</span>
                {!open && <span class="closed">Cerrado</span>}
            </header>
            <div class="rail">
                {products.map((p, i) => (
                    <Slide key={p.id} p={p} open={open} i={i} n={products.length} onPick={onPick} />
                ))}
            </div>
            <footer class="foot">
                Pide con Waada ·{" "}
                <a href={`https://waadafood.com/?ref=${encodeURIComponent(store.slug)}`}>¿Tienes restaurante? Recibe pedidos así →</a>
            </footer>
        </div>
    );
}
