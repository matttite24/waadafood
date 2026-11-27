# Waada Food — Especificación del MVP

**Dominios:** kioskos en `waadafood.com/{slug}` · panel del comercio en `app.waadafood.com` · QR por lugar con `?src=`.

Pantalla de pedidos tipo kiosko de comida rápida, pero virtual. Se abre desde un link (bio, historia, anuncio) o desde un QR pegado en un local; el cliente arma su pedido en pocos toques y lo envía por WhatsApp al restaurante. El restaurante ve los pedidos, con la ubicación en el mapa, en un panel instalable en su teléfono.

**No es un menú digital.** Es una pantalla de pedido con un flujo fijo y optimizado. El comercio solo llena datos; nunca diseña el flujo. (Lección de Fillter: cuando el comercio construía los flujos, hubo 2 conversiones de 10 000 visitas.)

---

## 0. Punto de partida: lo que ya existe

Repo `github.com/matttite24/waadafood`, rama `reset-waada`. Era un panel de chat con IA para WhatsApp (proyecto descartado). **Ya se limpió**: se borró la app Expo, el esquema y las funciones de Convex y todo el dashboard viejo.

| Pieza | Estado |
|---|---|
| Dominio `waadafood.com` y proyecto en Cloudflare | Configurados. `app.waadafood.com` ya apunta al panel |
| **Convex** | Despliegues existentes: producción y desarrollo. Esquema vacío, hay que escribirlo (§5.3) |
| **Kinde** (`waadafood.kinde.com`) | Funcionando: `convex/auth.config.js` (proveedor, usa `KINDE_DOMAIN`) y el puente Kinde → Convex en `web/src/main.tsx` (`audience="convex"`). **Se conserva tal cual** |
| `web/` | Vite + React 18 + Tailwind + Radix (componentes en `web/src/components/ui`). Es la base del panel. Hoy solo tiene login y una pantalla de inicio |
| Worker del kiosko, R2, Preact, PWA, push | **No existen todavía** |

Reglas heredadas del trabajo anterior:
- **No tocar la configuración de Kinde que ya funciona.** Costó varias iteraciones (bucle de render, audiencia). Los fallos conocidos: el objeto de autenticación de `ConvexProviderWithAuth` debe memoizarse, y la audiencia debe ser `convex` en el `KindeProvider` y en el login.
- **Nada de URLs, client IDs ni secretos en el código.** Todo por variables de entorno (sección 16).
- **Ninguna función de Convex acepta un `userId` desde el cliente.** El dueño siempre sale de `ctx.auth.getUserIdentity()`. El repo anterior no lo hacía y cualquiera podía leer el comercio de otro; no se repite.

---

## 1. Principios (no negociables)

1. **Velocidad primero.** El HTML llega completo, con el producto visible antes de que corra el JS.
2. **Una decisión por pantalla.** Botones grandes y un botón fijo abajo con el precio acumulado.
3. **Flujo fijo.** El comercio no puede reordenar pasos ni crear tipos de pantalla.
4. **Máximo 5 productos por comercio.** Es una decisión de producto, no una limitación técnica.
5. **Medir cada paso** del embudo con contadores propios, sin guardar una fila por evento.
6. **Cero terceros al cargar el kiosko.** Nada de Google Fonts ni scripts externos en la carga inicial.
7. **Una sola fuente de verdad: Convex.** El Worker de Cloudflare solo renderiza, cachea y sirve las fotos.
8. **Nunca bloquear al comensal.** Si el comercio pasa su límite, el pedido igual le llega a su WhatsApp; lo que se limita es el panel.

**Fuera de alcance de esta versión:** seguimiento de anuncios de Meta (píxel, API de Conversiones, UTM, `fbclid`), directorio público, pagos en línea, repartidores.

---

## 2. Arquitectura

```
Cliente (link o QR) ──▶ Worker de Cloudflare (waadafood.com)
   GET /:slug       → ¿menú en caché (5 min)? si no, lo pide a Convex (HTTP action /menu)
                      → renderToString(<Kiosko/>) → HTML + menú incrustado
   GET /assets/*    → bundle del kiosko (k.[hash].js) y del panel (caché eterna)
   GET /i/*         → fotos desde R2 (caché eterna)
   POST /api/pedido → reenvía a Convex (HTTP action /pedido)
   POST /api/eventos→ reenvía a Convex (HTTP action /eventos)
   PUT /api/imagen/*→ verifica el ticket firmado y guarda en R2

Panel PWA en app.waadafood.com (teléfono del dueño) ──▶ Convex directo (WebSocket, tiempo real)
   login con Kinde → el token se entrega a Convex (`auth.config.js`)
   consultas reactivas: pedidos, menú, reportes · mutaciones: guardar, publicar, cambiar estado

Convex ──▶ Web Push (acción de Node con `web-push`) al llegar un pedido
```

- **Dos despliegues en Cloudflare.** (1) El **Worker del kiosko** en `waadafood.com`: sirve `/:slug`, `/i/*`, `/assets/*` y `/api/*`. (2) El **panel** en `app.waadafood.com`: una SPA estática (`web/`, ya desplegada con Static Assets). Son independientes: un cambio en el panel no toca el kiosko.
- **Convex** guarda todo: comercios, menús (borrador y publicado), pedidos, contadores, suscripciones push.
- **R2** (binding `IMAGES`) guarda solo las fotos. No se usan KV ni D1.
- **Kinde** autentica al dueño. Convex valida el token de Kinde como proveedor OIDC. El Worker del kiosko no usa Kinde (el comensal no inicia sesión).
- Los endpoints públicos de Convex (`/menu`, `/pedido`, `/eventos`) **solo aceptan llamadas del Worker**: exigen la cabecera `x-waada-key` (secreto compartido). Así nadie los usa directamente y el navegador del cliente nunca habla con Convex.

### Por qué el HTML se arma en el Worker
El HTML no se guarda en ningún lado: el Worker lo genera en cada visita (~1 ms) con una plantilla (componentes Preact) y los datos (JSON del menú). Lo que se cachea es el **JSON del menú**, no el HTML. Así, cambiar el diseño del kiosko actualiza a todos los comercios con un solo deploy, y la vista previa del panel (un iframe con `?preview=1`) siempre muestra el diseño vigente.

---

## 3. Stack

| Pieza | Elección |
|---|---|
| UI del kiosko | Preact 10 + TypeScript |
| UI del panel | React 18 + TypeScript + Tailwind + Radix (lo que ya hay en `web/`) |
| Render en el servidor | `preact-render-to-string` (en el Worker) |
| Build | Vite (`@preact/preset-vite` para el kiosko, `@vitejs/plugin-react` para el panel) |
| Worker | Wrangler, TypeScript, router mínimo (o Hono) |
| Base de datos y lógica | Convex (queries, mutations, HTTP actions, acciones de Node) |
| Auth | Kinde (OIDC) → Convex, con `@kinde-oss/kinde-auth-react` en el panel |
| Fotos | R2 |
| Imágenes (en el navegador del comercio) | `OffscreenCanvas` (WebP) + `@jsquash/avif` (WASM) en un Web Worker |
| Cliente de Convex en el panel | `convex/react` (`ConvexProviderWithAuth`), ya integrado con Kinde |
| Validación | Validadores de Convex (`v.object`…) en el servidor; nada de librerías de validación en el bundle del kiosko |
| Paquetes | npm con `legacy-peer-deps` (como ya está el repo); `web/` y el Worker del kiosko como carpetas separadas |

---

## 4. Estructura del repo

```
waadafood/
├─ convex/
│  ├─ auth.config.js       # Kinde como proveedor (existe)
│  ├─ schema.ts            # tablas de la sección 5
│  ├─ http.ts              # /menu, /pedido, /eventos (solo con x-waada-key)
│  ├─ stores.ts            # getMine, getOrCreateMine, saveDraft, publish
│  ├─ orders.ts            # create (interna), listMine, setStatus
│  ├─ stats.ts             # reportes y embudo
│  ├─ images.ts            # requestUploadTicket (acción)
│  ├─ push.ts              # subscribe + notifyOrder ("use node")
│  └─ admin.ts             # verificar WhatsApp, activar Pro (solo ADMIN_IDS)
├─ web/                    # PANEL (React) → app.waadafood.com   (existe)
│  ├─ src/main.tsx         # Kinde + Convex (existe, no tocar la lógica)
│  ├─ src/pages/           # Pedidos, Menú, Reportes, Cuenta
│  └─ wrangler.jsonc
├─ kiosko/                 # KIOSKO (Preact) → waadafood.com
│  ├─ worker/              # index.ts (router), render.ts, upload.ts
│  ├─ client/main.tsx      # hidratación → assets/k.[hash].js
│  ├─ components/          # App, Home, Builder, Cart, Checkout, Sent + styles.css (inline)
│  └─ wrangler.jsonc
├─ shared/                 # types.ts, limits.ts, price.ts, message.ts (sin dependencias de UI)
└─ reference/prototipo.html
```

`shared/` lo importan el kiosko y el panel (el panel usa `price.ts` y `limits.ts` para la vista previa). La vista previa del panel **no** reutiliza los componentes Preact del kiosko: se muestra en un `<iframe>` que recibe el borrador por POST (ver §7 y 12.5).

---

## 5. Modelo de datos (Convex)

### 5.1 Menú (JSON dentro de `stores.draftMenu` y `stores.publishedMenu`)

```ts
type Money = number; // USD, 2 decimales

interface Menu {
  version: number;            // se incrementa al publicar
  store: {
    slug: string;             // "brasa-y-pan"
    name: string;
    phone: string;            // para wa.me, sin "+": "593988200451"
    currency: '$';
    color: string;            // color de marca (hex)
    hours?: WeeklyHours;      // opcional; fuera de horario el kiosko muestra "Cerrado"
    delivery: { enabled: boolean; pickup: boolean; fee?: Money; note?: string };
    payments: ('efectivo' | 'transferencia')[];
  };
  products: Product[];        // 1..5
  upsells: Upsell[];          // 0..2 (combo, bebida…)
}

interface Product {
  id: string;                 // "hamburguesa" (también sirve de enlace directo)
  name: string;
  tag?: string;               // "La más pedida"
  desc: string;               // ≤ 140 caracteres
  color: string;              // fondo del hero
  image?: ImageSet;           // si falta, se usa el color + nombre
  variants: Variant[];        // 1..4 (si es 1, se salta la pantalla)
  groups: Group[];            // 0..3
  upsell: boolean;
  available: boolean;         // "Agotado" sin borrar el producto
}

interface Variant { id: string; label: string; note?: string; price: Money }

interface Group {
  id: string;
  title: string;              // "¿Le agregamos algo?"
  type: 'one' | 'many';       // 'one' = obligatorio, avanza al tocar
  prefix?: string;            // "Sin" para grupos de quitar ingredientes
  max?: number;               // solo para 'many'
  options: Option[];          // 1..8
}

interface Option { id: string; label: string; price: Money }
interface Upsell { id: string; label: string; note: string; price: Money }

interface ImageSet {
  key: string;                // "{storeId}/{hash}" → /i/{key}-{w}.{ext}
  widths: [480, 720, 1080];
  lqip: string;               // data:image/webp;base64,… (~300 bytes)
  w: number; h: number;
}
```

### 5.2 Límites (`shared/limits.ts`)
- Productos: 1–5. Variantes: 1–4. Grupos por producto: 0–3. Opciones por grupo: 1–8. Upsells: 0–2.
- Descripción ≤ 140 caracteres; nombre de producto ≤ 40.
- Foto original: máx. 12 MB (se procesa en el navegador del comercio); cada variante subida ≤ 400 KB.
- Los límites se aplican con validadores de Convex en `saveDraft` y `publish`, no solo en el panel.

### 5.3 Tablas (`convex/schema.ts`)

```ts
stores: {
  ownerId: string,             // sujeto (sub) del token de Kinde
  slug: string,                // único (se verifica en la mutación)
  name: string,
  waNumber: string,            // único (se verifica en la mutación)
  waVerified: boolean,
  plan: 'free' | 'pro',
  planUntil?: number,
  draftMenu: Menu,
  publishedMenu?: Menu,
  publishedVersion: number,
  lat?: number, lng?: number,  // ubicación del local (para el directorio futuro)
  category?: string,
  directoryOptIn: boolean,     // "quiero aparecer en el directorio"
  createdAt: number,
}  // índices: by_slug, by_owner, by_wa

orders: {
  storeId, code, sessionId,    // dedupe por (sessionId, code)
  items: [...], clientTotal, serverTotal, mismatch: boolean,
  customerName, mode: 'domicilio' | 'retiro',
  lat?, lng?, accuracy?, reference?,
  payment, cashAmount?,
  status: 'enviado' | 'confirmado' | 'entregado' | 'cancelado',
  src?: string,                // origen del QR o link: "qr-terminal"
  monthKey: string,            // "2026-11" en hora de Ecuador
  monthSeq: number,            // n.º de pedido del comercio en ese mes
  createdAt,
}  // índices: by_store_created, by_store_session_code

counters: { storeId, monthKey, orders }                      // índice by_store_month
dailyStats: { storeId, day, orders, revenue, upsellOrders, deliveryOrders }
funnel: { storeId, day, step, count }                        // índice by_store_day_step
pushSubs: { storeId, endpoint, keys, createdAt }             // índices by_store, by_endpoint
```

Notas:
- Convex no tiene índices únicos: `slug` y `waNumber` se comprueban dentro de la mutación (las mutaciones son transaccionales, así que no hay carreras).
- **No se guarda una fila por evento.** Los eventos del embudo solo incrementan contadores en `funnel`.
- Los reportes se leen de `dailyStats` y `funnel`, no recorriendo pedidos.
- Mes y día se calculan en hora de Ecuador (UTC−5, sin horario de verano): `new Date(Date.now() - 5*3600*1000).toISOString()`.

---

## 6. Funciones y rutas

### 6.1 HTTP actions de Convex (solo con `x-waada-key`)
| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/menu?slug=` | Devuelve `publishedMenu` (JSON). 404 si no existe o no está publicado. |
| POST | `/pedido` | Valida, recalcula el total con `publishedMenu`, guarda el pedido, incrementa `counters` y `dailyStats`, y programa el push. Idempotente por `(sessionId, code)`. Máx. 5 pedidos por hora por sesión (el límite por IP con `x-client-ip` queda para después). |
| POST | `/eventos` | Un solo lote por visita. Incrementa `funnel`. Descarta lo que no esté en la lista de pasos válidos. |

El Worker agrega `x-client-ip` (de `cf-connecting-ip`) para la limitación por IP.

### 6.2 Funciones del panel (exigen sesión de Kinde; el dueño solo accede a su comercio)
**Regla:** ninguna recibe `userId`; el dueño sale de `ctx.auth.getUserIdentity().subject` (el `sub` de Kinde, `kp_...`). Una función sin sesión falla.

`stores.getMine` · `stores.getOrCreateMine` (registro) · `stores.saveDraft` · `stores.publish` · ``orders.listMine` (reactiva) · `orders.setStatus` · `stats.summary` · `stats.funnel` · `images.requestUploadTicket` (acción) · `push.subscribe`.

### 6.3 Funciones de administración (solo `ADMIN_IDS`)
`admin.verifyWhatsApp(storeId)` · `admin.setPlan(storeId, plan, until)`. `ADMIN_IDS` es una lista de `sub` de Kinde separados por coma.

### 6.4 Rutas del Worker
| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/health` | Responde 200 (para comprobar el despliegue). |
| GET | `/:slug` | Renderiza el kiosko (sección 7). |
| GET | `/assets/*` | Static Assets del kiosko. |
| GET | `/i/:key` | Foto desde R2, `Cache-Control: public, max-age=31536000, immutable`. |
| POST | `/api/pedido`, `/api/eventos` | Reenvía a Convex y responde 204 sin esperar. Máx. 8 KB. |
| PUT | `/api/imagen/:storeId/:file` | Exige `Authorization: Bearer <ticket>` válido (sección 10). |

**Slugs reservados:** `app`, `api`, `assets`, `i`, `health`, `panel`, `admin`, `www`, `login`, `static`. Se rechazan en `saveDraft` y en el registro. Un usuario tiene **un solo comercio** (las sucursales llegan con Pro).

Configurar `assets.run_worker_first` para que `/:slug`, `/i/*` y `/api/*` pasen primero por el Worker.

---

## 7. El HTML del kiosko (`worker/render.ts`)

```tsx
const MENU_TTL = 300; // segundos

if (/^[a-z0-9-]{2,40}$/.test(slug)) {
  const key = new Request(`https://cache.local/menu/${slug}`);
  let res = await caches.default.match(key);
  if (!res) {
    res = await fetch(`${env.CONVEX_SITE_URL}/menu?slug=${slug}`, { headers: { 'x-waada-key': env.INGEST_KEY } });
    if (!res.ok) return notFound();
    res = new Response(res.body, res);
    res.headers.set('Cache-Control', `public, max-age=${MENU_TTL}`);
    ctx.waitUntil(caches.default.put(key, res.clone()));
  }
  const menu = await res.json();
  return new Response(layout(menu, renderToString(<Kiosko menu={menu} />)), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
```

Requisitos:
- En el `tsconfig`: `"jsx": "react-jsx"` y `"jsxImportSource": "preact"`.
- **La caché del Worker solo funciona en el dominio propio**, no en `workers.dev`. Probar siempre en `waadafood.com`.
- Cambios publicados se ven en el kiosko en hasta 5 minutos (lo que dura la caché). El panel lo avisa: "Publicado, visible en unos minutos".

Estructura del HTML devuelto:

```html
<!DOCTYPE html><html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{store.name} · Pide aquí</title>
<meta property="og:title" …><meta property="og:image" content="/i/{key}-720.webp">
<link rel="preload" as="image" fetchpriority="high" type="image/avif"
      imagesrcset="…480.avif 480w, …720.avif 720w, …1080.avif 1080w"
      imagesizes="(max-width:520px) 100vw, 520px">
<style>/* styles.css incrustado, < 8 KB */</style>
</head><body>
<div id="app"><!-- renderToString(<Kiosko/>) --></div>
<script type="application/json" id="menu">{…}</script>
<script type="module" src="/assets/k.[hash].js"></script>
</body></html>
```

- **Escapar el JSON incrustado:** reemplazar `<` por `\u003c`, para que un `</script>` dentro del menú no rompa el HTML.
- **Producto inicial:** aceptar `?p=hamburguesa` (lo ve el servidor) y `#hamburguesa` (lo resuelve el cliente al hidratar).
- **Vista previa (`POST /{slug}?preview=1`):** el panel envía el borrador como campo de formulario (`menu`, ≤ 100 KB) a un `<iframe>`. El Worker lo valida con una comprobación mínima de forma, lo renderiza con el mismo código y responde `Cache-Control: no-store`; no lee la caché, no guarda nada y no registra embudo. Solo `PANEL_ORIGIN` (por defecto `https://app.waadafood.com`) puede incrustarlo (`frame-ancestors`); el resto de las páginas llevan `frame-ancestors 'none'`. Un `GET` con `?preview=1` da 404.
- **Horario:** si `store.hours` existe, el servidor calcula abierto o cerrado en `America/Guayaquil`.
- **Cabeceras:** `Cache-Control: no-cache` para el HTML y una `Content-Security-Policy` estricta (`default-src 'self'`; `img-src 'self' data:`).
- El hash del bundle se inyecta en el build (manifest de Vite) como constante del Worker.

Hidratación (`kiosko-client/main.tsx`):
```ts
import { hydrate } from 'preact';
const menu = JSON.parse(document.getElementById('menu')!.textContent!);
hydrate(<Kiosko menu={menu} />, document.getElementById('app')!);
```

---

## 8. Flujo del kiosko (fijo)

**Un producto por pedido.** Producto → Variantes → Extras → Datos con ubicación → WhatsApp. No hay carrito ni pantalla de "agregar otro".

1. **Inicio:** carrusel horizontal con scroll-snap (funciona sin JavaScript: flechas y puntos son anclas); un producto a pantalla completa (color y foto), nombre, descripción, "Desde $X" y el botón **Lo quiero**. Cerrado o agotado: el botón se desactiva.
2. **Variante:** se salta si hay una sola. Tocar = elegir y avanzar.
3. **Extras:** un grupo por pantalla. `one` avanza al tocar; `many` usa chips con "Siguiente · $X" o "Continuar sin cambios". El combo o la bebida son un grupo más (ej. "¿Lo hacemos combo?"); **no existe un paso de upsell aparte**.
4. **Datos con ubicación:**
   - A domicilio / Retiro en local (según la configuración del comercio).
   - **Usar mi ubicación** (`navigator.geolocation`, `enableHighAccuracy`, timeout 10 s). Requiere HTTPS. Muestra la precisión en metros.
   - Referencia escrita (obligatoria si no hay GPS; más de 5 caracteres).
   - Nombre (obligatorio).
   - Pago: efectivo o transferencia; si es efectivo, "¿Con cuánto pagas?" (opcional).
5. **Enviar:** `<a href="https://wa.me/{phone}?text=…">` (enlace normal, no `window.open`). En el `onClick`: `navigator.sendBeacon('/api/pedido', payload)` y, a los 400 ms, se muestra "Pedido #XXXX listo", con el número del local visible como texto y "Hacer otro pedido". En la vista previa no se envía el aviso.

El botón "atrás" del navegador retrocede un paso (cada paso se guarda en el historial). El envío, si el comercio lo configuró, se suma al total y al mensaje.

### Mensaje de WhatsApp (`shared/message.ts`)
```
*Pedido #39HE* · Brasa & Pan

1× Hamburguesa de la casa · Doble — $8.50
   · Tocino
   · Sin: cebolla
   · Hazlo combo (papas medianas + bebida)

*Total: $8.50*

Nombre: Ana
Entrega: a domicilio
Ubicación: https://maps.google.com/?q=-1.492300,-78.002100
Referencia: casa verde frente a la cancha
Pago: efectivo (paga con $20)
```
- El código del pedido tiene 4 caracteres del alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, generado en el cliente. Es solo una referencia humana: el servidor deduplica por `(sessionId, code)` y no exige que sea único en el comercio.
- **El servidor recalcula el total** con `publishedMenu`. Si difiere del total del cliente (por ejemplo, el menú cambió dentro de la ventana de caché), guarda ambos y marca `mismatch`; el panel lo muestra con un aviso.

### Origen del enlace (QR por lugar)
`waadafood.com/{slug}?src=qr-terminal` guarda `src` en el pedido. No se registra nada más del origen.

---

## 9. Presupuesto de rendimiento

| Recurso | Meta |
|---|---|
| HTML (con CSS inline + JSON), comprimido | < 12 KB |
| `k.[hash].js` (Preact + kiosko), comprimido | < 15 KB |
| Imagen principal (AVIF 720 px) | < 50 KB |
| Primera carga total | < 100 KB |
| Dominios en la carga inicial | **1** |
| LCP en 4G (móvil medio) | < 1.5 s |
| INP | < 150 ms |

Reglas:
- **Sin Google Fonts.** Fuente del sistema, o una sola woff2 auto-hospedada y recortada a caracteres latinos (< 20 KB), con `preload` y `font-display: swap`.
- **Imágenes:** `<picture>` con AVIF → WebP, `srcset` 480/720/1080, `sizes="(max-width:520px) 100vw, 520px"`, `width` y `height` siempre. La primera lleva `fetchpriority="high"` y precarga; el resto `loading="lazy" decoding="async"`. LQIP como `background-image` del contenedor.
- **Ningún script de terceros.**
- **Nada de librerías de validación, fechas ni UI** en el bundle del kiosko. Revisar con `vite-bundle-visualizer`.
- Medición real: `web-vitals` mínimo; LCP, INP y CLS viajan en el mismo aviso único del embudo (sección 11).

---

## 10. Fotos

### En el navegador del comercio
1. El comercio elige o toma una foto (`<input type="file" accept="image/*">`).
2. Un Web Worker:
   - `createImageBitmap` → recorte cuadrado opcional → redimensiona a 1080, 720 y 480 con `OffscreenCanvas`.
   - WebP: `convertToBlob({ type: 'image/webp', quality: 0.75 })`.
   - AVIF: `@jsquash/avif`, calidad ~55, speed 6.
   - LQIP: 16 px de ancho, WebP calidad 0.4, en base64.
3. `hash` = primeros 10 caracteres del SHA-256 del WebP de 1080.
4. Metas de peso: AVIF 720 < 50 KB, WebP 720 < 80 KB. Si se pasa, baja la calidad un paso y reintenta una vez.

### Subida segura a R2
1. El panel llama a `images.requestUploadTicket({ file })`. Es una **acción** de Convex (no una mutación, porque firma con criptografía): verifica la sesión de Kinde y el comercio, y devuelve un ticket = `base64url({ storeId, file, exp })` + firma HMAC-SHA256 con `UPLOAD_SECRET`. Vence en 10 minutos.
2. El navegador hace `PUT /api/imagen/{storeId}/{hash}-{w}.{ext}` con `Authorization: Bearer <ticket>`.
3. El Worker verifica firma, vencimiento, que el `storeId` y el archivo coincidan con el ticket, tipo `image/avif` o `image/webp` y tamaño ≤ 400 KB; entonces guarda en R2.
4. El panel guarda el `ImageSet` en `draftMenu`.

Los nombres llevan hash, así que nunca cambian de contenido: caché eterna segura.

---

## 11. Embudo (contadores propios)

Pasos válidos: `landing`, `product_pick`, `step_view`, `add_to_cart`, `cart_view`, `checkout_view`, `geo_ok`, `geo_err`, `send_click`.

- El cliente junta los eventos de la visita y los envía **en un solo aviso** (`sendBeacon('/api/eventos')`) cuando la página pasa a segundo plano (`visibilitychange → hidden`) o tras tocar "Enviar". Va junto con `lcp`, `inp` y `cls`, y un indicador de si abrió dentro de una app (por el user agent) para depurar.
- Convex solo incrementa `funnel(storeId, day, step)`. **No se guarda una fila por evento.**
- `sessionId`: aleatorio por pestaña, en `sessionStorage` con try/catch.
- El panel muestra el embudo de los últimos 7 días y la conversión `landing → send_click`.

---

## 12. Panel del comercio: PWA mobile-first

El dueño opera desde su teléfono, el mismo donde le llega el WhatsApp. **El panel se diseña para 360 px y una mano.** El escritorio es secundario: la misma interfaz en una columna centrada.

### 12.1 Acceso (Kinde, ya montado)
- Login y registro con **Kinde** (`@kinde-oss/kinde-auth-react`). El token (`audience="convex"`) se entrega a `ConvexProviderWithAuth`; `fetchAccessToken` devuelve siempre un token vigente.
- En Kinde hay que registrar las URLs de callback y de cierre de sesión de `https://app.waadafood.com` y de `http://localhost:5173`. El `redirectUri` y el `logoutUri` salen de `window.location.origin`.
- La sesión de 90 días es **configuración de Kinde** (vida del refresh token), no código.
- Si el login en la PWA instalada en iOS falla al salir a `waadafood.kinde.com` y volver, se pasa a un dominio propio en Kinde (`auth.waadafood.com`). Se prueba en F2.
- Registro de comercio nuevo (`stores.getOrCreateMine`): formulario corto (nombre, WhatsApp, categoría, ubicación en el mapa opcional) que crea `stores` con un menú de ejemplo.

### 12.2 Navegación y diseño
- **Barra inferior fija** (en pantallas pequeñas) con 4 pestañas: **Pedidos** · **Menú** · **Reportes** · **Cuenta**. Badge con los pedidos nuevos.
- Objetivos táctiles ≥ 48 px, acciones principales al alcance del pulgar, inputs de 16 px, `env(safe-area-inset-*)`.
- Formularios del editor en **hojas inferiores**, una sección a la vez, nunca tablas anchas.
- Reordenar productos con botones ↑/↓ (el arrastrar en móvil es frágil).

### 12.3 PWA
- `manifest.webmanifest`: `name: "Waada Panel"`, `display: "standalone"`, `start_url: "/pedidos"`, `scope: "/"`, íconos de 192/512 px y una versión maskable.
- **Service worker solo en `app.waadafood.com`**, nunca en el kiosko (otro dominio). Pre-cachea el shell y **no intercepta** las navegaciones a Kinde ni al callback de login. Los datos llegan por Convex en tiempo real; sin red se muestra el último estado guardado.
- Banner propio de "Instalar":
  - Android: captura `beforeinstallprompt`.
  - iOS: instrucciones de "Compartir → Agregar a inicio", detectando si no está en `standalone`.
- Editar y publicar **requieren conexión**; sin red se avisa claramente.

### 12.4 Alertas de pedido nuevo (lo más importante del panel)
- **Web Push** con claves VAPID. Al crear un pedido, la mutación programa una acción de Node (`"use node"`, librería `web-push`) que envía el aviso a todas las `pushSubs` del comercio. En iOS solo funciona con la PWA instalada en la pantalla de inicio (iOS 16.4+), así que el alta guía la instalación.
- Con la app abierta: **sonido** + vibración + badge (`navigator.setAppBadge`). El audio necesita un primer toque, así que hay un botón "Activar sonido de pedidos".
- **Sin "modo cocina".** Se probó una pantalla siempre encendida (`wakeLock`) y se descartó: no funcionaba bien y no resuelve el problema real, que es enterarse del pedido con el teléfono bloqueado. Eso lo cubre el Web Push. Desde la lista, un pedido se confirma o se entrega con un solo toque.
- La lista de pedidos es una **consulta reactiva** de Convex: aparece sola, sin sondeo.

### 12.5 Pantallas
- **Pedidos:** tarjetas grandes (código, hora relativa, total, domicilio o retiro), filtros Nuevos / En curso / Hechos. El detalle muestra ítems, **Abrir en Maps**, un mapa pequeño (Leaflet + OSM, cargado solo en esa pantalla), y los botones de estado. No hay "Responder por WhatsApp": el kiosko no conoce el número del cliente (el mensaje le llega al dueño por WhatsApp y ahí se responde).
- **Menú:** lista de los ≤ 5 productos con interruptor de **Agotado**. Cada producto abre una hoja inferior con variantes, grupos y foto. **Vista previa** a pantalla completa: un `<iframe>` al que el panel envía el borrador por POST (ver §7); el kiosko lo muestra sin leer la caché ni guardar pedidos. Indicador "Cambios sin publicar" y botón **Publicar** fijo abajo. No hay historial de versiones: publicar reemplaza lo anterior.
- **Reportes:** ventas del día, la semana y el mes, ticket promedio, aceptación del upsell y el embudo.
- **Cuenta:** datos del local, WhatsApp verificado, horario, plan y uso ("32 de 50 pedidos este mes"), link del kiosko con **Copiar** y **Compartir** (`navigator.share`), **Mi QR** (sección 12.6) y la opción de aparecer en el directorio.

### 12.6 QR para imprimir
- El panel genera el QR en el navegador (librería de QR mínima, salida SVG) para `waadafood.com/{slug}?src={lugar}`. El comercio crea varios, uno por lugar ("terminal", "colegio", "parque").
- **Cartel listo para imprimir** (CSS de impresión, A5 y A6): nombre del local, el QR grande y "Escanea y pide · llega a tu WhatsApp". También se puede descargar el QR en SVG.
- El panel muestra los pedidos por `src` del mes.

### 12.7 Presupuesto del panel
El panel es React + Radix, más pesado que el kiosko, y eso es aceptable: lo usa el dueño, no el comensal. Metas: JS inicial < 250 KB comprimido, **interactivo en < 3 s** en 4G, rutas y el mapa cargados por demanda (`React.lazy`), y apertura instantánea una vez instalado. Quitar la fuente de Google Fonts de `web/index.html` (auto-hospedarla o usar la del sistema).

---

## 12b. Planes, límites y verificación

### Planes
| | Gratis | Pro |
|---|---|---|
| Precio | $0 | **$9/mes** o **$90/año** |
| Pedidos | 50 por mes calendario (se renueva el día 1) | Ilimitados |
| Kiosko (5 productos, extras, upsell, Agotado) | ✓ | ✓ |
| QR por lugar | ✓ | ✓ |
| Pedidos en el panel con mapa y push | ✓ hasta el pedido 50 | ✓ |
| Reportes | Total del mes | Completos + embudo |
| Horario automático | — | ✓ |
| Sucursales / varios números | — | ✓ |
| Pie de página "Pide con Waada" | Normal | Reducido (nunca se quita) |

### Regla de oro al pasar el límite
**Nunca se bloquea al comensal.** Desde el pedido 51 del mes (`monthSeq > 50`) en un comercio gratuito:
- El kiosko sigue funcionando y el pedido **sí llega al WhatsApp**.
- En el panel aparece **bloqueado**: código y hora visibles; detalle, mapa y reportes ocultos tras "Activa Pro para verlo". **El ocultamiento se aplica en la consulta de Convex**, no solo en la interfaz.
- Avisos al comercio al llegar a 40/50 y a 50/50 (push + banner).

### Cobro (MVP: manual)
- Transferencia o QR de pago. El comercio sube el comprobante y el administrador activa el plan (`plan`, `planUntil`) desde `admin.setPlan`.
- Más adelante: link de pago con acreditación automática.

### Verificación del WhatsApp (antiabuso)
- **Un número de WhatsApp = una cuenta** (`waNumber`, comprobado en la mutación). El kiosko no se publica hasta verificar el número.
- Flujo sin SMS: el panel muestra **Verificar mi WhatsApp**, que abre `wa.me/{número de Waada}?text=WAADA-4821`. Al recibir ese código desde el número declarado, se marca `waVerified`. En el MVP lo hace el administrador a mano (`admin.verifyWhatsApp`).
- Señales de duplicado, solo como alertas: mismo hash de foto o mismo menú y precios en varias cuentas. La respuesta es escribirle al comercio y ofrecerle unir las cuentas en Pro con sucursales; nunca bloquear de forma automática.

### Pie de página viral (todos los kioskos)
`Pide con Waada · ¿Tienes restaurante? Recibe pedidos así →` con link a `waadafood.com/?ref={slug}`.

---

## 13. Presupuesto de llamadas a Convex

Estimaciones para dimensionar (verificar en el panel de uso de Convex durante la primera semana de pruebas):
- **Menú:** hasta ~9 mil llamadas al mes por restaurante con caché de 5 minutos (mucho menos con poco tráfico).
- **Pedido:** ~12 llamadas (aviso, guardado, push, panel, cambios de estado).
- **Visita con embudo:** ~2 llamadas (un solo aviso por visita).

| Escenario | Llamadas al mes (techo) |
|---|---|
| 5 restaurantes · 1 000 visitas · 100 pedidos c/u | ~60 mil |
| 30 restaurantes · 3 000 visitas · 300 pedidos c/u | ~550 mil |
| 100 restaurantes · mismas cifras | ~1.9 millones (≈ $2 al mes de excedente en Starter) |

Reglas:
- **No usar el plan Free en producción:** al excederlo por un tiempo, Convex puede devolver errores. Pasar a **Starter** (pago por uso) **antes de la primera campaña**, con límite de gasto.
- Subir la caché del menú a 10 minutos si hiciera falta.
- Almacenamiento: el plan gratuito trae 0.5 GB. Archivar o borrar pedidos de más de 6 meses cuando haya muchos comercios.

---

## 14. Fases del MVP

**F0 — Base** (la limpieza del repo ya está hecha)
- Mover a variables de entorno el client ID de Kinde, el dominio de Kinde y la URL de Convex (hecho en `web/src/main.tsx` y `convex/auth.config.js`).
- Escribir `convex/schema.ts` (sección 5.3) y `stores.getOrCreateMine`, `stores.getMine` con `ctx.auth`. **Ninguna función recibe `userId`.**
- Decidir qué pasa con los datos del esquema viejo en producción (o crear un despliegue de Convex nuevo).
- Crear el bucket R2 y el binding `IMAGES`; secretos `INGEST_KEY` y `UPLOAD_SECRET` en el Worker y en Convex.
- Un comercio de prueba con el teléfono `593988200451`.
- ✅ `npm run dev` y `npx convex dev` levantan; el login con Kinde funciona y el panel muestra el comercio del usuario; otro usuario no puede leerlo.

**F1 — Kiosko con render en el servidor**
- Portar el prototipo (`reference/prototipo.html`) a componentes en `shared/kiosko/`.
- `renderKiosko()` con la caché del menú, la acción HTTP `/menu` y la hidratación.
- ✅ El HTML trae el producto visible sin JS.
- ✅ El flujo completo abre WhatsApp con el mensaje correcto.
- ✅ Se cumple el presupuesto de la sección 9 (Lighthouse móvil ≥ 95).

**F2 — Pedidos y panel PWA**
- `/pedido` con recálculo en el servidor, contadores y push.
- Panel instalable: login, pestaña Pedidos con detalle, mapa y estados, manifest, service worker, instalación, sonido y push.
- ✅ Un pedido enviado desde el celular aparece en el panel en menos de 10 s **y** llega un push al teléfono con la PWA instalada (Android y iOS).
- ✅ El panel se usa de punta a punta con una mano en un teléfono de 360 px.

**F3 — Editor, publicación y fotos**
- Editor del menú con límites, vista previa en el panel, publicar (sin historial de versiones).
- Pipeline de fotos de la sección 10.
- QR por lugar y cartel imprimible (12.6).
- ✅ Cambiar un precio y publicar se refleja en el kiosko en ≤ 5 minutos.

**F4 — Embudo y reportes**
- `/eventos`, contadores, vista de embudo y reportes.
- ✅ Se ve dónde se pierde la gente, por paso.

**F4.5 — Planes, verificación y captación** (solo con 5 comercios usando el kiosko)
- Verificación del WhatsApp, conteo mensual, bloqueo en el panel desde el pedido 51, activación manual de Pro.
- Página de captación en `/` (qué es, precio y "Registrarme" que lleva a `app.waadafood.com`) y pie de página con `?ref=`.
- ✅ Un comercio gratuito con 51 pedidos sigue recibiendo el pedido 51 en WhatsApp y lo ve bloqueado en el panel.

**F5 — Después del MVP**
- Pago automático de Pro, sucursales, dominio propio por comercio, costo de envío por zona.
- Directorio (ver fases de negocio).

### Fases de negocio y cuándo pasar a la siguiente
| Fase | Qué es | Pasa a la siguiente cuando… |
|---|---|---|
| 1 | Restaurantes usan Waada como link en redes o QR en sitios de interés | Hay unos 20 restaurantes con pedidos reales por semana |
| 2 | Plan Pro de bajo costo | Al menos 5 pagan y siguen pagando a los 2 meses |
| 3 | Directorio: galería que se desliza, con fotos de platos, ordenada por cercanía | Una ciudad tiene unos 30 restaurantes con foto limpia |

Para no cerrar la fase 3 desde ahora: guardar ubicación del local, categoría y la casilla "quiero aparecer en el directorio" (ya están en `stores`). La galería usará fotos con el fondo recortado sobre un color liso, y cada foto abrirá el kiosko en ese producto (`?p=`). Las consultas por cercanía en Convex se resuelven con un geohash indexado (decidirlo en esa fase).

---

## 15. Pruebas obligatorias en dispositivos reales

Antes de dar por cerrada cada fase, probar en:
- Instagram y Facebook en iOS (WKWebView) y en Android (WebView de Chrome).
- Navegador normal (Safari y Chrome).

Qué revisar: tiempo hasta ver el producto, permiso de ubicación, que `wa.me` abra la app de WhatsApp (incluyendo WhatsApp Business), el botón fijo con el teclado abierto, las safe areas en iPhone, el modo oscuro del sistema y el push en iPhone con la PWA instalada.

---

## 16. Variables de entorno y comandos

| Dónde | Variable | Para qué |
|---|---|---|
| Panel (`web/.env.local`; en Cloudflare, variables de build) | `VITE_CONVEX_URL` | URL del despliegue de Convex |
| | `VITE_KINDE_CLIENT_ID` | Client ID de la app de Kinde |
| | `VITE_KINDE_DOMAIN` | `https://waadafood.kinde.com` |
| Convex (`npx convex env set`) | `KINDE_DOMAIN` | Mismo dominio; lo lee `auth.config.js` |
| | `INGEST_KEY`, `UPLOAD_SECRET`, `VAPID_*`, `ADMIN_IDS` | Secretos de la spec |
| Worker del kiosko (`wrangler secret put`) | `INGEST_KEY`, `UPLOAD_SECRET`, `CONVEX_SITE_URL` | Mismos valores que en Convex |

Las variables `VITE_*` terminan en el bundle del navegador: solo van valores públicos (el client ID de Kinde es público). **Los secretos nunca llevan prefijo `VITE_`.** Producción y desarrollo usan despliegues de Convex distintos, así que `VITE_CONVEX_URL` cambia por entorno; no se adivina por el hostname.

```bash
cd web && npm i --legacy-peer-deps && npm run dev   # panel en :5173
npx convex dev                                      # base de datos y funciones
npx convex env set KINDE_DOMAIN https://waadafood.kinde.com
cd web && npm run build && wrangler deploy          # panel → app.waadafood.com
cd kiosko && wrangler deploy                        # kiosko → waadafood.com
npx convex deploy
```

---

## 17. Referencia visual

El prototipo `reference/prototipo.html` (Preact + htm, todo en un archivo) define el look & feel del MVP:
- Rojo tomate de campo, tinta casi negra, botón mostaza con sombra "física" y botón verde de WhatsApp.
- Títulos condensados en negrita y textos en sans.
- Opciones de 68 px de alto, borde de 2 px y estado activo en rojo.

En F1 se reemplazan las ilustraciones SVG por `<picture>` con fotos reales (dejando el SVG o el color de respaldo cuando no hay foto) y Google Fonts por la fuente auto-hospedada o la del sistema.
