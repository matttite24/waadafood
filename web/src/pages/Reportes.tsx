import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Vacio } from "@/components/panel/Vacio";

const money = (n: number) => `$${n.toFixed(2)}`;
const DOW = ["D", "L", "M", "M", "J", "V", "S"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function monthLabel(key: string) {
    const [y, m] = key.split("-").map(Number);
    return `${MONTHS[m - 1]} ${y}`;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-2xl border p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}

function Ranking({ title, rows }: { title: string; rows: { label: string; orders: number }[] }) {
    if (rows.length === 0) return null;
    const max = Math.max(...rows.map((r) => r.orders));
    return (
        <section className="mb-4 rounded-2xl border p-4">
            <h2 className="mb-3 font-semibold">{title}</h2>
            <ul className="flex flex-col gap-3">
                {rows.map((r) => (
                    <li key={r.label}>
                        <div className="mb-1 flex justify-between text-sm">
                            <span className="truncate">{r.label}</span>
                            <span className="tabular-nums text-muted-foreground">{r.orders}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${(r.orders / max) * 100}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function Reportes() {
    const data = useQuery(api.stats.summary);
    if (data === undefined || data === null) return null;

    const { month } = data;

    return (
        <>
            <h1 className="mb-1 text-2xl font-bold">Reportes</h1>
            <p className="mb-4 text-sm capitalize text-muted-foreground">{monthLabel(month.key)}</p>

            {month.orders === 0 && !data.pro ? (
                <Vacio titulo="Sin datos todavía" texto="Cuando lleguen pedidos, aquí verás tus ventas del mes." />
            ) : (
                <div className="mb-4 grid grid-cols-2 gap-3">
                    <Stat label="Pedidos del mes" value={String(month.orders)} />
                    <Stat label="Ventas del mes" value={money(month.revenue)} />
                    <div className="col-span-2">
                        <Stat label="Ticket promedio" value={money(month.avgTicket)} sub="Lo que gasta en promedio cada cliente" />
                    </div>
                </div>
            )}

            {!data.pro && (
                <section className="rounded-2xl border border-dashed p-4 text-center">
                    <p className="font-semibold">Reportes completos con Pro</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Hoy, últimos 7 días, productos más pedidos, domicilio vs retiro y pedidos por QR.
                    </p>
                </section>
            )}

            {data.pro && (
                <>
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <Stat label="Hoy" value={money(data.today.revenue)} sub={`${data.today.orders} pedidos`} />
                        <Stat label="Últimos 7 días" value={money(data.week.revenue)} sub={`${data.week.orders} pedidos`} />
                    </div>

                    <section className="mb-4 rounded-2xl border p-4">
                        <h2 className="mb-3 font-semibold">Ventas de los últimos 7 días</h2>
                        {(() => {
                            const max = Math.max(...data.last7.map((d) => d.revenue), 1);
                            return (
                                <div className="flex h-36 items-end gap-2">
                                    {data.last7.map((d) => {
                                        const dow = new Date(`${d.day}T12:00:00Z`).getUTCDay();
                                        return (
                                            <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${money(d.revenue)} · ${d.orders} pedidos`}>
                                                <span className="text-[10px] tabular-nums text-muted-foreground">{d.revenue > 0 ? Math.round(d.revenue) : ""}</span>
                                                <div className="w-full rounded-t-md bg-primary" style={{ height: `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 1)}%`, opacity: d.revenue > 0 ? 1 : 0.2 }} />
                                                <span className="text-xs text-muted-foreground">{DOW[dow]}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </section>

                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <Stat label="A domicilio" value={`${data.deliveryPct}%`} sub={`Retiro: ${month.orders > 0 ? 100 - data.deliveryPct : 0}%`} />
                    </div>

                    <Ranking title="Lo más pedido del mes" rows={data.products.map((p) => ({ label: p.name, orders: p.orders }))} />
                    <Ranking title="Pedidos por QR o enlace" rows={data.sources.map((s) => ({ label: s.src, orders: s.orders }))} />
                </>
            )}
        </>
    );
}
