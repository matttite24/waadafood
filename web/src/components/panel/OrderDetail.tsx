import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Section, SheetHead, StatusBadge } from "./kit";
import { IconBloqueado, IconCopiar, IconDinero, IconDomicilio, IconLocal, IconAviso, IconUbicacion } from "@/components/icons";
import { errorText } from "./PublishBar";
import { NEXT_ACTION, STATUS_LABEL, money, ticketText, timeOf, type OpenOrder, type OrderRow } from "@/lib/orders";

function MapPreview({ lat, lng }: { lat: number; lng: number }) {
    const d = 0.003;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d / 1.5},${lng + d},${lat + d / 1.5}&layer=mapnik&marker=${lat},${lng}`;
    return <iframe title="Mapa" src={src} className="h-44 w-full rounded-xl border" loading="lazy" referrerPolicy="no-referrer" />;
}

export default function OrderDetail({ order, onClose }: { order: OrderRow | null; onClose: () => void }) {
    const setStatus = useMutation(api.orders.setStatus);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const o = order && !order.locked ? (order as OpenOrder) : null;

    // Cancelar pide un segundo toque (evita cancelar por accidente con las manos ocupadas).
    useEffect(() => { setConfirmCancel(false); }, [order?._id]);
    useEffect(() => { if (!confirmCancel) return; const t = setTimeout(() => setConfirmCancel(false), 4000); return () => clearTimeout(t); }, [confirmCancel]);

    async function change(status: OrderRow["status"]) {
        if (!order) return;
        try {
            await setStatus({ id: order._id, status });
            if (status === "cancelado" || status === "entregado") onClose();
        } catch (e) {
            toast.error(errorText(e, "No se pudo cambiar el estado"));
        }
    }

    async function copy() {
        if (!o) return;
        await navigator.clipboard.writeText(ticketText(o));
        toast.success("Pedido copiado");
    }

    const next = order ? NEXT_ACTION[order.status] : undefined;
    const canCancel = order && !order.locked && (order.status === "enviado" || order.status === "confirmado");

    return (
        <Drawer open={!!order} onOpenChange={(v) => !v && onClose()}>
            <DrawerContent className="max-h-[92vh]">
                <SheetHead
                    title={`Pedido #${order?.code ?? ""}`}
                    subtitle={order && <span className="inline-flex items-center gap-2">{timeOf(order.createdAt)} <StatusBadge status={order.status} label={STATUS_LABEL[order.status]} /></span>}
                />
                <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
                    {order?.locked && (
                        <Section className="flex items-start gap-3 bg-muted">
                            <IconBloqueado className="mt-0.5 size-5 shrink-0" />
                            <p className="text-sm">Este pedido pasó el límite de 50 del mes del plan gratuito. Tu cliente sí lo envió por WhatsApp. <b>Activa Pro para verlo aquí.</b></p>
                        </Section>
                    )}
                    {o && (
                        <>
                            {o.mismatch && (
                                <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                                    <IconAviso weight="fill" className="mt-0.5 size-5 shrink-0" />
                                    <p>El cliente vio {money(o.clientTotal)} pero el total correcto es <b>{money(o.total)}</b> (el menú cambió mientras pedía). Confírmalo por WhatsApp.</p>
                                </div>
                            )}

                            <Section>
                                {o.items.map((it, i) => (
                                    <div key={i}>
                                        <p className="text-lg font-semibold">{it.name}{it.variantLabel ? ` · ${it.variantLabel}` : ""}</p>
                                        <ul className="mt-1 space-y-0.5 text-base text-muted-foreground">
                                            {it.options.map((x, j) => <li key={j}>• {x.prefix ? `${x.prefix} ` : ""}{x.label}{x.price > 0 ? ` (+${money(x.price)})` : ""}</li>)}
                                        </ul>
                                    </div>
                                ))}
                                <div className="mt-3 flex items-baseline justify-between border-t pt-3">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="text-2xl font-bold tabular-nums">{money(o.total)}</span>
                                </div>
                            </Section>

                            <Section>
                                <p className="mb-3 text-lg font-semibold">{o.customerName}</p>
                                <ul className="space-y-2.5 text-base">
                                    <li className="flex items-center gap-3">{o.mode === "domicilio" ? <IconDomicilio className="size-5 text-muted-foreground" /> : <IconLocal className="size-5 text-muted-foreground" />}{o.mode === "domicilio" ? "A domicilio" : "Retiro en el local"}</li>
                                    <li className="flex items-center gap-3"><IconDinero className="size-5 text-muted-foreground" />{o.payment === "efectivo" ? "Efectivo" : "Transferencia"}{o.payment === "efectivo" && o.cashAmount ? ` · paga con ${money(o.cashAmount)}` : ""}</li>
                                    {o.reference && <li className="flex items-start gap-3"><IconUbicacion className="mt-0.5 size-5 shrink-0 text-muted-foreground" />{o.reference}</li>}
                                </ul>
                                {o.src && <p className="mt-3 text-sm text-muted-foreground">Origen: {o.src}</p>}
                            </Section>

                            {o.lat !== undefined && o.lng !== undefined && (
                                <Section title="Ubicación" icon={<IconUbicacion />}>
                                    <MapPreview lat={o.lat} lng={o.lng} />
                                    <Button asChild variant="outline" className="mt-3 w-full">
                                        <a href={`https://maps.google.com/?q=${o.lat},${o.lng}`} target="_blank" rel="noreferrer">Abrir en Maps</a>
                                    </Button>
                                    {o.accuracy !== undefined && <p className="mt-2 text-center text-sm text-muted-foreground">Precisión del GPS: ±{Math.round(o.accuracy)} m</p>}
                                </Section>
                            )}
                        </>
                    )}
                </div>
                {o && (
                    <DrawerFooter>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={copy}><IconCopiar />Copiar</Button>
                            {next && <Button className="flex-1" onClick={() => change(next.status)}>{next.label}</Button>}
                        </div>
                        {canCancel && (
                            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => (confirmCancel ? change("cancelado") : setConfirmCancel(true))}>
                                {confirmCancel ? "Toca de nuevo para cancelar" : "Cancelar pedido"}
                            </Button>
                        )}
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    );
}
