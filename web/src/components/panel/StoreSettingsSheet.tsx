import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, PriceInput } from "@/components/ui/field";
import { Section, SheetHead } from "./kit";
import { IconDomicilio, IconLocal, IconDinero } from "@/components/icons";
import type { Store } from "./PanelLayout";

export type StoreSettings = Store["draftMenu"]["store"];
type Payment = StoreSettings["payments"][number];

export interface ProfileForm {
    name: string;
    category: string;
    settings: StoreSettings;
}

const CATEGORIES = ["Hamburguesas", "Pizzas", "Pollo", "Comida típica", "Mariscos", "Parrilla", "Postres", "Café", "Bebidas", "Desayunos"];

function Row({ icon, label, hint, children }: { icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode }) {
    return (
        <label className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-3 [&_svg]:size-5 [&_svg]:text-muted-foreground">
                {icon}
                <span>
                    <span className="block text-base font-medium">{label}</span>
                    {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
                </span>
            </span>
            {children}
        </label>
    );
}

/** Datos del local: nombre, categoría, color, entrega y pagos. El WhatsApp y el enlace no se cambian desde aquí. */
export default function StoreSettingsSheet({
    open, store, onClose, onSave,
}: {
    open: boolean;
    store: Store;
    onClose: () => void;
    onSave: (f: ProfileForm) => Promise<void>;
}) {
    const initial: ProfileForm = { name: store.name, category: store.category ?? "", settings: store.draftMenu.store };
    const [f, setF] = useState<ProfileForm>(initial);
    const [busy, setBusy] = useState(false);
    useEffect(() => { if (open) setF({ name: store.name, category: store.category ?? "", settings: store.draftMenu.store }); }, [open, store]);

    const s = f.settings;
    const setS = (patch: Partial<StoreSettings>) => setF({ ...f, settings: { ...s, ...patch } });
    const setDelivery = (patch: Partial<StoreSettings["delivery"]>) => setS({ delivery: { ...s.delivery, ...patch } });
    const togglePayment = (id: Payment) => setS({ payments: s.payments.includes(id) ? s.payments.filter((p) => p !== id) : [...s.payments, id] });

    const nameErr = f.name.trim().length < 2 ? "Escribe el nombre de tu local." : null;
    const noMode = !s.delivery.enabled && !s.delivery.pickup;
    const noPayment = s.payments.length === 0;
    const problem = nameErr ?? (noMode ? "Activa al menos una forma de entrega." : noPayment ? "Activa al menos una forma de pago." : null);
    const dirty = JSON.stringify(f) !== JSON.stringify(initial);

    return (
        <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
            <DrawerContent className="max-h-[94vh]">
                <SheetHead title="Datos del local" />
                <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
                    <Section title="Tu local">
                        <div className="flex flex-col gap-4">
                            <Field label="Nombre" error={nameErr && f.name.length > 0 ? nameErr : null}>
                                <Input maxLength={60} autoComplete="off" autoCapitalize="words" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                            </Field>
                            <Field label="Categoría" optional>
                                <Input list="categorias" maxLength={40} autoComplete="off" autoCapitalize="sentences" placeholder="Ej.: Hamburguesas" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
                            </Field>
                            <datalist id="categorias">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
                            <label className="flex items-center justify-between gap-3">
                                <span className="text-base font-medium">Color de tu marca</span>
                                <input type="color" aria-label="Color de tu marca" className="h-12 w-16 shrink-0 rounded-xl border" value={s.color} onChange={(e) => setS({ color: e.target.value })} />
                            </label>
                        </div>
                    </Section>

                    <Section title="Cómo entregas">
                        <div className="flex flex-col gap-5">
                            <Row icon={<IconDomicilio />} label="A domicilio"><Switch checked={s.delivery.enabled} onCheckedChange={(c) => setDelivery({ enabled: c })} /></Row>
                            <Row icon={<IconLocal />} label="Retiro en el local"><Switch checked={s.delivery.pickup} onCheckedChange={(c) => setDelivery({ pickup: c })} /></Row>
                            {s.delivery.enabled && (
                                <>
                                    <Field label="Costo de envío" optional hint="Se suma al total del pedido a domicilio">
                                        <PriceInput value={s.delivery.fee ?? 0} onChange={(n) => setDelivery({ fee: n > 0 ? Math.min(n, 100) : undefined })} />
                                    </Field>
                                    <Field label="Nota de entrega" optional hint="Ej.: Solo dentro de la ciudad">
                                        <Input maxLength={80} autoComplete="off" autoCapitalize="sentences" value={s.delivery.note ?? ""} onChange={(e) => setDelivery({ note: e.target.value || undefined })} />
                                    </Field>
                                </>
                            )}
                        </div>
                    </Section>

                    <Section title="Formas de pago">
                        <div className="flex flex-col gap-5">
                            <Row icon={<IconDinero />} label="Efectivo"><Switch checked={s.payments.includes("efectivo")} onCheckedChange={() => togglePayment("efectivo")} /></Row>
                            <Row icon={<IconDinero />} label="Transferencia"><Switch checked={s.payments.includes("transferencia")} onCheckedChange={() => togglePayment("transferencia")} /></Row>
                        </div>
                    </Section>
                </div>
                <DrawerFooter className="border-t bg-background">
                    {problem && <p role="alert" className="text-center text-sm text-destructive">{problem}</p>}
                    <Button size="lg" disabled={busy || !!problem || !dirty}
                        onClick={async () => { setBusy(true); try { await onSave(f); } finally { setBusy(false); } }}>
                        {busy ? "Guardando…" : dirty ? "Guardar cambios" : "Sin cambios"}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
