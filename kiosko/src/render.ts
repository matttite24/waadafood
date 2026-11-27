import { renderToString } from "preact-render-to-string";
import { h } from "preact";
import { Kiosko, safeColor, imgSrcset } from "./components/Kiosko";
import { isOpen } from "./hours";
import { CSS } from "./styles";
import { CLIENT_JS } from "./asset.gen";
import type { Menu } from "../../shared/types";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Si llega `?p=id`, ese producto va primero; el resto conserva su orden. */
function withSelectedFirst(menu: Menu, selected?: string | null): Menu {
    if (!selected) return menu;
    const i = menu.products.findIndex((p) => p.id === selected);
    if (i <= 0) return menu;
    const products = [menu.products[i], ...menu.products.filter((_, j) => j !== i)];
    return { ...menu, products };
}

export function layout(input: Menu, opts: { selected?: string | null; preview?: boolean } = {}): string {
    const menu = withSelectedFirst(input, opts.selected);
    const open = isOpen(menu.store.hours);
    const app = renderToString(h(Kiosko, { menu, open }));
    const first = menu.products[0]?.image;
    const okKey = first && /^[a-z0-9]+\/[a-f0-9]{10}$/.test(first.key);
    const preload = okKey
        ? `<link rel="preload" as="image" fetchpriority="high" type="image/webp" imagesrcset="${esc(imgSrcset(first.key, [480, 720, 1080]))}" imagesizes="(max-width:520px) 100vw, 520px">`
        : "";
    const og = okKey ? `<meta property="og:image" content="/i/${first.key}-720.webp">` : "";
    // Escapar "<" evita que un "</script>" dentro del menú cierre la etiqueta.
    const json = JSON.stringify(menu).replace(/</g, "\\u003c");
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(menu.store.name)} · Pide aquí</title>
<meta property="og:title" content="${esc(menu.store.name)} · Pide aquí">
<meta name="theme-color" content="${safeColor(menu.store.color, "#C8321F")}">
${og}${preload}
<style>${CSS}</style></head><body>
<div id="app" data-open="${open ? 1 : 0}"${opts.preview ? ' data-preview="1"' : ""}>${app}</div>
<script type="application/json" id="menu">${json}</script>
<script type="module" src="${CLIENT_JS}"></script>
</body></html>`;
}
