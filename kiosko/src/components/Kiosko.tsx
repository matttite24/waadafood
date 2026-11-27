import type { Menu } from "../../../shared/types";

const money = (n: number) => `$${n.toFixed(2)}`;

/** F1, paso 1: solo el inicio (producto visible sin JS). El flujo completo llega con la hidratación. */
export function Kiosko({ menu }: { menu: Menu }) {
    const p = menu.products.find((x) => x.available) ?? menu.products[0];
    const from = Math.min(...p.variants.map((v) => v.price));
    return (
        <main class="k">
            <section class="hero" style={`background:${p.color}`}>
                <h2>{menu.store.name}</h2>
                {p.tag && <span class="tag">{p.tag}</span>}
                <h1>{p.name}</h1>
                <p>{p.desc}</p>
                <strong class="from">Desde {money(from)}</strong>
            </section>
            <a class="cta" href={`#${p.id}`}>Lo quiero</a>
        </main>
    );
}
