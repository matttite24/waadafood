import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Store } from "./PanelLayout";

export type StoreSettings = Store["draftMenu"]["store"];
type Payment = StoreSettings["payments"][number];

const PAYMENTS: { id: Payment; label: string }[] = [
    { id: "efectivo", label: "Efectivo" },
    { id: "transferencia", label: "Transferencia" },
];

/** Datos del local que usa el kiosko: color, entrega, retiro, envío y formas de pago (spec §5.1). */
export default function StoreSettingsSheet({
    open, settings, onClose, onSave,
}: {
    open: boolean;
    settings: StoreSettings;
    onClose: () => void;
    onSave: (s: StoreSettings) => Promise<void>;
}) {
    const [s, setS] = useState(settings);
    const [busy, setBusy] = useState(false);
    useEffect(() => { if (open) setS(settings); }, [open, settings]);

    const setDelivery = (patch: Partial<StoreSettings["delivery"]>) => setS({ ...s, delivery: { ...s.delivery, ...patch } });
    const togglePayment = (id: Payment) =>
        setS({ ...s, payments: s.payments.includes(id) ? s.payments.filter((p) => p !== id) : [...s.payments, id] });

    const noMode = !s.delivery.enabled && !s.delivery.pickup;
    const noPayment = s.payments.length === 0;

    return (
        <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
            <DrawerContent className="max-h-[92vh]">
                <DrawerHeader><DrawerTitle>Datos del local</DrawerTitle></DrawerHeader>
                <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-4">
                    <div className="flex items-center justify-between gap-3">
                        <Label>Color de tu marca</Label>
                        <input type="color" className="h-12 w-16 rounded-xl border" value={s.color} onChange={(e) => setS({ ...s, color: e.target.value })} />
                    </div>

                    <section className="flex flex-col gap-3">
                        <h3 className="font-semibold">Cómo entregas</h3>
                        <div className="flex items-center justify-between">
                            <Label>A domicilio</Label>
                            <Switch checked={s.delivery.enabled} onCheckedChange={(c) => setDelivery({ enabled: c })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Retiro en el local</Label>
                            <Switch checked={s.delivery.pickup} onCheckedChange={(c) => setDelivery({ pickup: c })} />
                        </div>
                        {noMode && <p className="text-sm text-destructive">Activa al menos una forma de entrega.</p>}
                        {s.delivery.enabled && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Label>Costo de envío (USD, opcional)</Label>
                                    <Input className="h-12" type="number" inputMode="decimal" min={0} step="0.01"
                                        value={s.delivery.fee ?? ""}
                                        onChange={(e) => setDelivery({ fee: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Nota de entrega (opcional)</Label>
                                    <Input className="h-12" maxLength={80} placeholder="Solo dentro de la ciudad" value={s.delivery.note ?? ""}
                                        onChange={(e) => setDelivery({ note: e.target.value || undefined })} />
                                </div>
                            </>
                        )}
                    </section>

                    <section className="flex flex-col gap-3">
                        <h3 className="font-semibold">Formas de pago</h3>
                        {PAYMENTS.map((p) => (
                            <div key={p.id} className="flex items-center justify-between">
                                <Label>{p.label}</Label>
                                <Switch checked={s.payments.includes(p.id)} onCheckedChange={() => togglePayment(p.id)} />
                            </div>
                        ))}
                        {noPayment && <p className="text-sm text-destructive">Activa al menos una forma de pago.</p>}
                    </section>
                </div>
                <DrawerFooter>
                    <Button className="h-12" disabled={busy || noMode || noPayment}
                        onClick={async () => { setBusy(true); try { await onSave(s); } finally { setBusy(false); } }}>
                        Guardar
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
