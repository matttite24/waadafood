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
/* Flujo de compra: texto grande sobre el fondo, sin bordes. --bg y --ink se fijan por pantalla. */
.flow{position:fixed;left:0;right:0;top:var(--vvt,0);height:var(--vvh,100svh);background:var(--bg);color:var(--ink)}
.top2{display:flex;align-items:center;gap:6px;padding:calc(8px + env(safe-area-inset-top)) 16px 8px 4px}
.back{appearance:none;border:0;background:none;color:inherit;width:48px;height:48px;font-size:36px;line-height:1;cursor:pointer;flex:none}
.sum{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
.sum b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sum small{font-size:13px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tot{font-weight:800;font-size:20px;flex:none}
.num{font-variant-numeric:tabular-nums}
.fbody{flex:1;overflow-y:auto;padding:8px 20px 20px;display:flex;flex-direction:column;gap:12px;animation:rise .28s ease-out}
.fbody.center{justify-content:center}
.fbody h2{font:800 clamp(34px,10vw,46px)/1 "Arial Narrow",system-ui,sans-serif;margin:12px 0 6px;overflow-wrap:anywhere}
.stack{display:flex;flex-direction:column;gap:12px}
.fbar{padding:12px 16px calc(12px + env(safe-area-inset-bottom))}
.opt2,.chip2,.in2{border:0;color:inherit;background:rgba(128,128,128,.18);background:color-mix(in srgb,var(--ink) 11%,transparent)}
.opt2{appearance:none;width:100%;min-height:72px;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:0 20px;border-radius:20px;font:700 24px system-ui,sans-serif;text-align:left;cursor:pointer}
.opt2 small{display:block;font-weight:400;font-size:14px;opacity:.75}
.opt2.on,.chip2.on{background:var(--ink);color:var(--bg)}
.opt2:active{transform:scale(.985)}
.chips2{display:flex;flex-wrap:wrap;gap:10px}
.chip2{appearance:none;min-height:56px;padding:0 20px;border-radius:99px;font:700 20px system-ui,sans-serif;cursor:pointer}
.chip2 small{font-weight:500;font-size:15px;opacity:.8}
.in2{appearance:none;outline:0;width:100%;min-height:72px;padding:0 20px;border-radius:20px;font:700 26px system-ui,sans-serif;caret-color:currentColor}
.in2::placeholder{color:inherit;opacity:.4}
.in2:focus{background:color-mix(in srgb,var(--ink) 17%,transparent)}
.cta2{appearance:none;border:0;width:100%;min-height:68px;border-radius:18px;background:var(--ink);color:var(--bg);font:800 22px system-ui,sans-serif;cursor:pointer}
.cta2:disabled{opacity:.35;cursor:default}
.cta2.inline{margin-top:6px}
.cta2.wa{display:flex;align-items:center;justify-content:center;gap:6px;background:#25D366;color:#fff;text-decoration:none;box-shadow:0 4px 0 #168a43}
.cta2.wa.off{opacity:.4;pointer-events:none;box-shadow:none}
.note2{font-size:15px;opacity:.8}
.linkbtn{appearance:none;border:0;background:none;color:inherit;text-decoration:underline;text-align:left;padding:8px 0;cursor:pointer;font-family:inherit}
.err2{font-size:15px;font-weight:700}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.fbody{animation:none}}
`;
