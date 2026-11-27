import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Vacio } from "@/components/panel/Vacio";
import OrderDetail, { money, STATUS_LABEL, type OrderRow } from "@/components/panel/OrderDetail";
import { isSoundOn, setSound } from "@/lib/alerts";
import { cn } from "@/lib/utils";

type Filter = "nuevos" | "curso" | "hechos";
const FILTERS: { id: Filter; label: string; match: (s: OrderRow["status"]) => boolean }[] = [
    { id: "nuevos", label: "Nuevos", match: (s) => s === "enviado" },
    { id: "curso", label: "En curso", match: (s) => s === "confirmado" },
    { id: "hechos", label: "Hechos", match: (s) => s === "entregado" || s === "cancelado" },
];

function ago(ms: number, now: number): string {
    const m = Math.max(0, Math.round((now - ms) / 60000));
    if (m < 1) return "ahora";
    if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60);
    return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

/** Modo cocina: la pantalla no se apaga mientras esté activo (spec §12.4). */
function useWakeLock(on: boolean) {
    useEffect(() => {
        if (!on || !("wakeLock" in navigator)) return;
        let lock: WakeLockSentinel | null = null;
        const acquire = () => navigator.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
        void acquire();
        const onVisible = () => document.visibilityState === "visible" && void acquire();
        document.addEventListener("visibilitychange", onVisible);
        return () => { document.removeEventListener("visibilitychange", onVisible); void lock?.release(); };
    }, [on]);
}

export default function Pedidos() {
    const orders = useQuery(api.orders.listMine);
    const [filter, setFilter] = useState<Filter>("nuevos");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sound, setSoundState] = useState(isSoundOn);
    const [kitchen, setKitchen] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    useWakeLock(kitchen);
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

    if (orders === undefined) return null;

    const counts = Object.fromEntries(FILTERS.map((f) => [f.id, orders.filter((o) => f.match(o.status)).length])) as Record<Filter, number>;
    const shown = orders.filter((o) => FILTERS.find((f) => f.id === filter)!.match(o.status));
    const selected = orders.find((o) => o._id === selectedId) ?? null;

    return (
        <>
            <h1 className="mb-3 text-2xl font-bold">Pedidos</h1>

            <div className="mb-3 flex gap-2">
                <Button variant={sound ? "default" : "outline"} className="h-12 flex-1" onClick={() => { const next = !sound; setSound(next); setSoundState(next); }}>
                    {sound ? "Sonido activado" : "Activar sonido"}
                </Button>
                <Button variant={kitchen ? "default" : "outline"} className="h-12 flex-1" onClick={() => setKitchen(!kitchen)}>
                    {kitchen ? "Modo cocina: sí" : "Modo cocina"}
                </Button>
            </div>

            <div className="mb-4 flex gap-2" role="tablist">
                {FILTERS.map((f) => (
                    <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
                        className={cn("h-12 flex-1 rounded-xl border text-sm font-medium", filter === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>
                        {f.label}{counts[f.id] > 0 && <span className="ml-1 tabular-nums">({counts[f.id]})</span>}
                    </button>
                ))}
            </div>

            {shown.length === 0 ? (
                <Vacio titulo={orders.length === 0 ? "Aún no hay pedidos" : "Nada por aquí"} texto={orders.length === 0 ? "Cuando alguien pida en tu kiosko, aparecerá aquí al instante." : "No hay pedidos en esta lista."} />
            ) : (
                <ul className="flex flex-col gap-3">
                    {shown.map((o) => (
                        <li key={o._id}>
                            <button onClick={() => setSelectedId(o._id)} className="w-full rounded-2xl border p-4 text-left active:bg-muted">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold">#{o.code}</span>
                                    <span className="text-sm text-muted-foreground">{ago(o.createdAt, now)}</span>
                                </div>
                                {o.locked ? (
                                    <p className="mt-1 text-sm text-muted-foreground">🔒 Activa Pro para verlo</p>
                                ) : (
                                    <>
                                        <p className="mt-1 truncate">{o.customerName} · {o.items[0]?.name}</p>
                                        <div className="mt-1 flex items-center gap-2 text-sm">
                                            <span className="font-semibold tabular-nums">{money(o.total)}</span>
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{o.mode === "domicilio" ? "Domicilio" : "Retiro"}</span>
                                            {o.mismatch && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Revisar total</span>}
                                            {o.status !== "enviado" && <span className="text-xs text-muted-foreground">{STATUS_LABEL[o.status]}</span>}
                                        </div>
                                    </>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <OrderDetail order={selected} onClose={() => setSelectedId(null)} />
        </>
    );
}
