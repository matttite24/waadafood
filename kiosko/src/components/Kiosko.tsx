import type { Menu, Product } from "../../../shared/types";

const money = (n: number) => `$${n.toFixed(2)}`;

const HEX = /^#[0-9a-fA-F]{6}$/;
export const safeColor = (c: string, fallback = "#F4C542") => (HEX.test(c) ? c : fallback);

/** Texto oscuro o claro según la luminosidad del fondo (contraste legible con cualquier color de marca). */
export function ink(bg: string): string {
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

function Slide({ p, open, i, n, brand, onPick }: { p: Product; open: boolean; i: number; n: number; brand: string; onPick?: (p: Product) => void }) {
    const bg = brand; // sin foto, el producto va sobre el color de la marca
    const from = Math.min(...p.variants.map((v) => v.price));
    const canOrder = open && p.available;
    const next = i < n - 1 ? `#p-${i + 1}` : null;
    return (
        <section id={`p-${i}`} class={p.image ? "slide has-img" : "slide"} data-product={p.id} style={p.image ? `background:${bg}` : `background:${bg};color:${ink(bg)}`}>
            <Photo p={p} first={i === 0} />
            <div class="top" />
            <div class="body">
                {p.tag && <span class="tag">{p.tag}</span>}
                <h1>{p.name}</h1>
                {p.desc && <p class="desc">{p.desc}</p>}
                <strong class="from">Desde {money(from)}</strong>
            </div>
            <button class="cta" type="button" data-pick={p.id} disabled={!canOrder} onClick={() => onPick?.(p)}>
                {!open ? "Cerrado ahora" : p.available ? "Lo quiero" : "Agotado"}
            </button>
            {next && <a class="more" href={next}>Desliza para ver más<span aria-hidden="true">⌄</span></a>}
        </section>
    );
}

/** Pantalla de inicio del kiosko: carrusel con scroll-snap que funciona sin JavaScript (flechas con anclas). */
export function Kiosko({ menu, open, onPick }: { menu: Menu; open: boolean; onPick?: (p: Product) => void }) {
    const { store, products } = menu;
    const brand = safeColor(store.color, "#C8321F");
    return (
        <div class="k">
            <header class="bar">
                <span class="pill" style={`background:${brand};color:${ink(brand)}`}>
                    <i class={open ? "live" : "off"} aria-hidden="true" />
                    <span class="pname">{store.name}</span>
                    {open && <span class="sr">Abierto</span>}
                    {!open && <span class="pstate">Cerrado</span>}
                </span>
            </header>
            <div class="rail">
                {products.map((p, i) => (
                    <Slide key={p.id} p={p} open={open} i={i} n={products.length} brand={brand} onPick={onPick} />
                ))}
            </div>
        </div>
    );
}
