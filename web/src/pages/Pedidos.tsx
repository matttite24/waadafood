import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import OrderDetail from "@/components/panel/OrderDetail";
import { Empty, IconButton, Spinner, StatusBadge } from "@/components/panel/kit";
import { errorText } from "@/components/panel/PublishBar";
import { IconBloqueado, IconDinero, IconDomicilio, IconLocal, IconPedidos, IconSinSonido, IconSonido, IconAviso } from "@/components/icons";
import { isSoundOn, setSound } from "@/lib/alerts";
import { NEXT_ACTION, STATUS_LABEL, ago, itemSummary, money, timeOf, type OrderRow } from "@/lib/orders";
import { cn } from "@/lib/utils";

type Filter = "nuevos" | "curso" | "hechos";
const FILTERS: { id: Filter; label: string; match: (s: OrderRow["status"]) => boolean }[] = [
    { id: "nuevos", label: "Nuevos", match: (s) => s === "enviado" },
    { id: "curso", label: "En curso", match: (s) => s === "confirmado" },
    { id: "hechos", label: "Hechos", match: (s) => s === "entregado" || s === "cancelado" },
];

function OrderCard({ o, now, onOpen, onAdvance }: { o: OrderRow; now: number; onOpen: () => void; onAdvance: () => void }) {
    const fresh = o.status === "enviado";
    const next = NEXT_ACTION[o.status];
    return (
        <li className={cn("overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none", fresh && "border-amber-300 ring-1 ring-amber-200")}>
            <button onClick={onOpen} className="block w-full p-4 text-left active:bg-muted">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xl font-bold tracking-tight">#{o.code}</span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        {timeOf(o.createdAt)} · {ago(o.createdAt, now)}
                    </span>
                </div>
                {o.locked ? (
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><IconBloqueado className="size-4" />Activa Pro para verlo</p>
                ) : (
                    <>
                        <div className="mt-2 flex items-baseline justify-between gap-3">
                            <p className="truncate text-base font-semibold">{o.customerName}</p>
                            <p className="text-lg font-bold tabular-nums">{money(o.total)}</p>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">{itemSummary(o)}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">{o.mode === "domicilio" ? <IconDomicilio className="size-4" /> : <IconLocal className="size-4" />}{o.mode === "domicilio" ? "Domicilio" : "Retiro"}</span>
                            <span className="flex items-center gap-1.5"><IconDinero className="size-4" />{o.payment === "efectivo" ? "Efectivo" : "Transferencia"}</span>
                            {o.status !== "enviado" && <StatusBadge status={o.status} label={STATUS_LABEL[o.status]} />}
                            {o.mismatch && <span className="flex items-center gap-1 font-medium text-amber-700"><IconAviso weight="fill" className="size-4" />Revisar total</span>}
                        </div>
                    </>
                )}
            </button>
            {!o.locked && next && (
                <div className="border-t p-2">
                    <Button className="w-full" variant={fresh ? "default" : "soft"} onClick={onAdvance}>{next.label}</Button>
                </div>
            )}
        </li>
    );
}

export default function Pedidos() {
    const orders = useQuery(api.orders.listMine);
    const setStatus = useMutation(api.orders.setStatus);
    const [picked, setPicked] = useState<Filter | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sound, setSoundState] = useState(isSoundOn);
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

    if (orders === undefined) return <Spinner />;

    const counts = Object.fromEntries(FILTERS.map((f) => [f.id, orders.filter((o) => f.match(o.status)).length])) as Record<Filter, number>;
    // Si el dueño no eligió una lista, abre la primera que tenga algo por atender.
    const filter: Filter = picked ?? (counts.nuevos > 0 ? "nuevos" : counts.curso > 0 ? "curso" : "nuevos");
    const shown = orders.filter((o) => FILTERS.find((f) => f.id === filter)!.match(o.status));
    const selected = orders.find((o) => o._id === selectedId) ?? null;

    async function advance(o: OrderRow) {
        const next = NEXT_ACTION[o.status];
        if (!next) return;
        try { await setStatus({ id: o._id, status: next.status }); } catch (e) { toast.error(errorText(e, "No se pudo cambiar el estado")); }
    }

    return (
        <>
            <div className="mb-3 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Pedidos</h1>
                <div className="flex gap-1">
                    <IconButton label={sound ? "Silenciar avisos" : "Activar sonido de pedidos"} variant={sound ? "soft" : "ghost"}
                        onClick={() => { const next = !sound; setSound(next); setSoundState(next); }}>
                        {sound ? <IconSonido weight="fill" /> : <IconSinSonido />}
                    </IconButton>
                </div>
            </div>
            {!sound && <p className="mb-3 -mt-1 text-sm text-muted-foreground">Activa el sonido (arriba) para que suene cuando llegue un pedido.</p>}

            <div className="mb-4 flex gap-2" role="tablist">
                {FILTERS.map((f) => (
                    <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setPicked(f.id)}
                        className={cn("h-12 flex-1 rounded-xl border text-base font-medium transition-colors", filter === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>
                        {f.label}{counts[f.id] > 0 && <span className="ml-1.5 tabular-nums">{counts[f.id]}</span>}
                    </button>
                ))}
            </div>

            {shown.length === 0 ? (
                <Empty icon={<IconPedidos />} title={orders.length === 0 ? "Aún no hay pedidos" : "Todo al día"}
                    text={orders.length === 0 ? "Comparte tu link o tu QR. Cuando alguien pida, aparecerá aquí al instante." : "No hay pedidos en esta lista."} />
            ) : (
                <ul className="flex flex-col gap-3">
                    {shown.map((o) => <OrderCard key={o._id} o={o} now={now} onOpen={() => setSelectedId(o._id)} onAdvance={() => advance(o)} />)}
                </ul>
            )}

            <OrderDetail order={selected} onClose={() => setSelectedId(null)} />
        </>
    );
}
