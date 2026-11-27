// CSS incrustado en el HTML (spec §7, < 8 KB). Fuente del sistema, cero terceros.
export const CSS = `
*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{font:16px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1412;background:#1a1412}
.k{height:100svh;display:flex;flex-direction:column;max-width:520px;margin:auto;background:#fff;position:relative}
.bar{position:absolute;z-index:2;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:calc(10px + env(safe-area-inset-top)) 16px 0;pointer-events:none}
.name{font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;opacity:.75}
.closed{background:#1a1412;color:#fff;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700}
.rail{flex:1;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain}
.rail::-webkit-scrollbar{display:none}
.slide{flex:0 0 100%;scroll-snap-align:start;scroll-snap-stop:always;display:flex;flex-direction:column;padding:0 20px 16px}
.slide{position:relative;overflow:hidden}
.photo{position:absolute;inset:0;background-size:cover;background-position:center}
.photo img{width:100%;height:100%;object-fit:cover;display:block}
.has-img{color:#fff}
.has-img::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.78) 0%,rgba(0,0,0,.25) 45%,rgba(0,0,0,0) 70%)}
.slide>.top,.slide>.body,.slide>.cta{position:relative;z-index:1}
.top{display:flex;justify-content:space-between;align-items:center;padding-top:calc(44px + env(safe-area-inset-top))}
.arrow{width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:34px;line-height:1;text-decoration:none;color:inherit;border-radius:99px}
.arrow.off{visibility:hidden}
.dots{font-size:11px;letter-spacing:.2em;opacity:.7}
.body{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;padding-bottom:20px}
.tag{align-self:flex-start;background:#1a1412;color:#fff;border-radius:99px;padding:4px 12px;font-size:12px;font-weight:700}
h1{font:800 clamp(40px,12vw,56px)/.98 "Arial Narrow",system-ui,sans-serif;letter-spacing:-.01em;overflow-wrap:anywhere}
.desc{font-size:18px;opacity:.9}
.from{font-variant-numeric:tabular-nums;font-size:22px}
.cta{appearance:none;border:0;width:100%;min-height:68px;border-radius:18px;background:#F4B400;color:#1a1412;font:800 22px system-ui,sans-serif;box-shadow:0 4px 0 #b88700;cursor:pointer}
.cta:active{transform:translateY(3px);box-shadow:0 1px 0 #b88700}
.cta:disabled{background:#d8d2c8;color:#6b625a;box-shadow:none;cursor:default}
.foot{padding:8px 16px calc(8px + env(safe-area-inset-bottom));text-align:center;font-size:12px;color:#6b625a;background:#fff}
.foot a{color:inherit}
/* Flujo de pedido */
.flow{background:#fff}
.fhead{display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 8px 8px;border-bottom:1px solid #eee;font-weight:700}
.back{appearance:none;border:0;background:none;width:48px;height:48px;font-size:36px;line-height:1;cursor:pointer;color:inherit}
.fbody{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:12px}
.fbody h2{font:800 30px/1.05 "Arial Narrow",system-ui,sans-serif}
.fbody.center{justify-content:center;text-align:center}
.fbar{padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid #eee;background:#fff}
.opt{appearance:none;width:100%;min-height:68px;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:0 18px;border:2px solid #1a1412;border-radius:16px;background:#fff;font:inherit;font-size:18px;color:inherit;text-align:left;cursor:pointer}
.opt small{display:block;font-weight:400;font-size:13px;opacity:.7}
.opt:active,.opt:disabled{border-color:var(--brand);background:color-mix(in srgb,var(--brand) 10%,#fff)}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{appearance:none;min-height:52px;padding:0 18px;border:2px solid #1a1412;border-radius:99px;background:#fff;font:inherit;font-weight:600;cursor:pointer}
.chip.on{background:var(--brand);border-color:var(--brand);color:#fff}
.num{font-variant-numeric:tabular-nums}
.total{display:flex;justify-content:space-between;font-size:20px;font-weight:800;padding:8px 4px}
.seg{display:flex;gap:8px}
.seg button{appearance:none;flex:1;min-height:56px;border:2px solid #1a1412;border-radius:14px;background:#fff;font:inherit;font-weight:700;cursor:pointer}
.seg button.on{background:var(--brand);border-color:var(--brand);color:#fff}
.field{display:flex;flex-direction:column;gap:8px;font-weight:600;font-size:14px}
.field input,.field label input{font:inherit;font-size:16px;min-height:52px;padding:0 14px;border:2px solid #cfc8bd;border-radius:14px;width:100%}
label input{margin-top:6px;font-weight:400}
.sum{font-size:16px;opacity:.85}
.note{font-size:13px;opacity:.7}
.err{color:#b3261e;font-size:14px}
.cta.wa{display:flex;align-items:center;justify-content:center;gap:6px;background:#25D366;color:#fff;text-decoration:none;box-shadow:0 4px 0 #168a43}
.cta.wa.off{background:#d8d2c8;color:#6b625a;box-shadow:none;pointer-events:none}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;
