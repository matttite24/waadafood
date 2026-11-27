import { renderToString } from "preact-render-to-string";
import { h } from "preact";
import { Kiosko } from "./components/Kiosko";
import { CSS } from "./styles";
import type { Menu } from "../../shared/types";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function layout(menu: Menu): string {
    const app = renderToString(h(Kiosko, { menu }));
    // < evita que un "</script>" dentro del menú cierre la etiqueta.
    const json = JSON.stringify(menu).replace(/</g, "\\u003c");
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(menu.store.name)} · Pide aquí</title>
<meta name="theme-color" content="${esc(menu.store.color)}">
<style>${CSS}</style></head><body>
<div id="app">${app}</div>
<script type="application/json" id="menu">${json}</script>
</body></html>`;
}
