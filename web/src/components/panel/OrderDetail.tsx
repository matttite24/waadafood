import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export type OrderRow = FunctionReturnType<typeof api.orders.listMine>[number];
type OpenOrder = Extract<OrderRow, { locked: false }>;

export const money = (n: number) => `$${n.toFixed(2)}`;

export const STATUS_LABEL: Record<OrderRow["status"], string> = {
    enviado: "Nuevo",
    confirmado: "En curso",
    entregado: "Entregado",
    cancelado: "Cancelado",
};

const NEXT: Record<OrderRow["status"], { status: OrderRow["status"]; label: string; danger?: boolean }[]> = {
    enviado: [{ status: "confirmado", label: "Confirmar pedido" }, { status: "cancelado", label: "Cancelar", danger: true }],
    confirmado: [{ status: "entregado", label: "Marcar entregado" }, { status: "cancelado", label: "Cancelar", danger: true }],
    entregado: [],
    cancelado: [],
};

function Map({ lat, lng }: { lat: number; lng: number }) {
    const d = 0.003;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d / 1.5},${lng + d},${lat + d / 1.5}&layer=mapnik&marker=${lat},${lng}`;
    return <iframe title="Mapa" src={src} className="h-44 w-full rounded-xl border" loading="lazy" referrerPolicy="no-referrer" />;
}

export default function OrderDetail({ order, onClose }: { order: OrderRow | null; onClose: () => void }) {
    const setStatus = useMutation(api.orders.setStatus);
    const o = order && !order.locked ? (order as OpenOrder) : null;

    async function change(status: OrderRow["status"]) {
        if (!order) return;
        try {
            await setStatus({ id: order._id, status });
            if (status === "cancelado" || status === "entregado") onClose();
        } catch (e) {
            toast.error(e instanceof Error ? e.message.replace(/^.*Uncaught Error: /s, "").split("\n")[0] : "No se pudo cambiar el estado");
        }
    }

    return (
        <Drawer open={!!order} onOpenChange={(v) => !v && onClose()}>
            <DrawerContent className="max-h-[92vh]">
                <DrawerHeader>
                    <DrawerTitle>Pedido #{order?.code}{order && <span className="ml-2 text-sm font-normal text-muted-foreground">{STATUS_LABEL[order.status]}</span>}</DrawerTitle>
                </DrawerHeader>
                <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
                    {order?.locked && (
                        <p className="rounded-xl border bg-muted p-4 text-sm">
                            Este pedido pasó el límite de 50 del mes del plan gratuito. El cliente sí lo envió por WhatsApp. <b>Activa Pro para verlo aquí.</b>
                        </p>
                    )}
                    {o && (
                        <>
                            {o.mismatch && (
                                <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                                    El cliente vio {money(o.clientTotal)} pero el total correcto es <b>{money(o.total)}</b> (el menú cambió mientras pedía). Confírmalo por WhatsApp.
                                </p>
                            )}
                            <section className="rounded-2xl border p-4">
                                {o.items.map((it, i) => (
                                    <div key={i}>
                                        <p className="font-semibold">1× {it.name}{it.variantLabel ? ` · ${it.variantLabel}` : ""}</p>
                                        <ul className="mt-1 text-sm text-muted-foreground">
                                            {it.options.map((x, j) => <li key={j}>· {x.prefix ? `${x.prefix}: ` : ""}{x.label}{x.price > 0 ? ` (+${money(x.price)})` : ""}</li>)}
                                        </ul>
                                    </div>
                                ))}
                                <p className="mt-3 text-lg font-bold tabular-nums">Total {money(o.total)}</p>
                            </section>
                            <section className="rounded-2xl border p-4 text-sm">
                                <p><b>{o.customerName}</b></p>
                                <p>{o.mode === "domicilio" ? "A domicilio" : "Retiro en el local"}</p>
                                <p>Pago: {o.payment}{o.payment === "efectivo" && o.cashAmount ? ` · paga con ${money(o.cashAmount)}` : ""}</p>
                                {o.reference && <p className="mt-1">Referencia: {o.reference}</p>}
                                {o.src && <p className="text-muted-foreground">Origen: {o.src}</p>}
                            </section>
                            {o.lat !== undefined && o.lng !== undefined && (
                                <section className="flex flex-col gap-2">
                                    <Map lat={o.lat} lng={o.lng} />
                                    <Button asChild variant="outline" className="h-12">
                                        <a href={`https://maps.google.com/?q=${o.lat},${o.lng}`} target="_blank" rel="noreferrer">Abrir en Maps</a>
                                    </Button>
                                    {o.accuracy !== undefined && <p className="text-center text-xs text-muted-foreground">Precisión del GPS: ±{Math.round(o.accuracy)} m</p>}
                                </section>
                            )}
                        </>
                    )}
                </div>
                {order && !order.locked && (
                    <DrawerFooter>
                        {NEXT[order.status].map((n) => (
                            <Button key={n.status} variant={n.danger ? "ghost" : "default"} className={n.danger ? "h-12 text-destructive" : "h-12"} onClick={() => change(n.status)}>{n.label}</Button>
                        ))}
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    );
}
