// CSS incrustado en el HTML (spec §7, < 8 KB). Fuente del sistema, cero terceros.
export const CSS = `
*{box-sizing:border-box;margin:0}
body{font:16px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1412;background:#fff}
.k{min-height:100svh;display:flex;flex-direction:column;max-width:520px;margin:auto}
.hero{flex:1;padding:24px 20px;display:flex;flex-direction:column;justify-content:flex-end;gap:8px}
.hero h2{font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;opacity:.7}
.hero h1{font:800 44px/1 "Arial Narrow",system-ui,sans-serif;letter-spacing:-.01em}
.tag{align-self:flex-start;background:#1a1412;color:#fff;border-radius:99px;padding:4px 10px;font-size:12px;font-weight:700}
.from{font-variant-numeric:tabular-nums;font-size:20px}
.cta{display:block;margin:16px;padding:20px;border-radius:16px;background:#F4B400;color:#1a1412;text-align:center;font-weight:800;font-size:20px;text-decoration:none;box-shadow:0 4px 0 #b88700}
`;
