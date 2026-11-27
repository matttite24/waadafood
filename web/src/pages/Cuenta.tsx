import { useState } from "react";
import { Link } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/panel/PanelLayout";
import { Section } from "@/components/panel/kit";
import PublishBar, { errorText } from "@/components/panel/PublishBar";
import StoreSettingsSheet, { type ProfileForm } from "@/components/panel/StoreSettingsSheet";
import { IconCompartir, IconCopiar, IconDomicilio, IconDinero, IconEditar, IconEnlace, IconLocal, IconQr, IconSalir, IconOk, IconAviso } from "@/components/icons";
import { formatWhatsApp } from "../../../shared/phone";
import { LIMITS } from "../../../shared/limits";

export default function Cuenta() {
    const store = useStore();
    const { logout } = useKindeAuth();
    const saveDraft = useMutation(api.stores.saveDraft);
    const updateProfile = useMutation(api.stores.updateProfile);
    const stats = useQuery(api.stats.summary);
    const [editing, setEditing] = useState(false);
    const link = `https://waadafood.com/${store.slug}`;
    const { delivery, payments } = store.draftMenu.store;

    async function onSaveProfile(f: ProfileForm) {
        try {
            await updateProfile({ name: f.name, category: f.category || undefined });
            await saveDraft({ menu: { ...store.draftMenu, store: { ...f.settings, name: f.name.trim() } } });
            toast.success("Guardado. Publica para que tus clientes lo vean.");
            setEditing(false);
        } catch (e) {
            toast.error(errorText(e, "No se pudo guardar"));
        }
    }

    async function onCopy() {
        await navigator.clipboard.writeText(link);
        toast.success("Enlace copiado");
    }

    async function onShare() {
        if (navigator.share) await navigator.share({ title: store.name, url: link }).catch(() => {});
        else await onCopy();
    }

    const used = stats?.month.orders ?? 0;
    const isFree = store.plan !== "pro";
    const pct = Math.min(100, Math.round((used / LIMITS.freeOrdersPerMonth) * 100));

    return (
        <>
            <h1 className="mb-4 text-2xl font-bold">Cuenta</h1>

            <div className="flex flex-col gap-4">
                <Section title="Tu página de pedidos" icon={<IconEnlace />}>
                    <p className="mb-3 break-all rounded-xl bg-muted px-3 py-3 text-base font-medium">{link}</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={onCopy}><IconCopiar />Copiar</Button>
                        <Button variant="outline" onClick={onShare}><IconCompartir />Compartir</Button>
                    </div>
                    <Button asChild variant="soft" className="mt-2 w-full"><Link to="/cuenta/qr"><IconQr />Mi QR para imprimir</Link></Button>
                </Section>

                <Section title={store.name} icon={<IconLocal />} action={<Button size="sm" variant="outline" onClick={() => setEditing(true)}><IconEditar />Editar</Button>}>
                    <ul className="space-y-2 text-base">
                        <li className="flex items-center gap-3"><span className="text-muted-foreground">WhatsApp</span><span className="font-medium">{formatWhatsApp(store.waNumber)}</span></li>
                        <li className="flex items-center gap-3">
                            {store.waVerified
                                ? <span className="flex items-center gap-1.5 text-sm text-emerald-700"><IconOk weight="bold" className="size-4" />Número verificado</span>
                                : <span className="flex items-center gap-1.5 text-sm text-amber-700"><IconAviso weight="fill" className="size-4" />Número sin verificar</span>}
                        </li>
                        <li className="flex items-center gap-3"><IconDomicilio className="size-5 text-muted-foreground" />{[delivery.enabled && "Domicilio", delivery.pickup && "Retiro"].filter(Boolean).join(" y ") || "Sin configurar"}{delivery.enabled && delivery.fee ? ` · envío $${delivery.fee.toFixed(2)}` : ""}</li>
                        <li className="flex items-center gap-3"><IconDinero className="size-5 text-muted-foreground" />{payments.map((p) => (p === "efectivo" ? "Efectivo" : "Transferencia")).join(" y ") || "Sin configurar"}</li>
                    </ul>
                </Section>

                <Section title={isFree ? "Plan gratuito" : "Plan Pro"}>
                    {isFree ? (
                        <>
                            <div className="mb-2 flex items-baseline justify-between">
                                <span className="text-sm text-muted-foreground">Pedidos de este mes</span>
                                <span className="font-semibold tabular-nums">{used} de {LIMITS.freeOrdersPerMonth}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-muted" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={LIMITS.freeOrdersPerMonth}>
                                <div className={`h-2.5 rounded-full ${pct >= 80 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">Pasado el límite, tus clientes siguen pidiendo, pero el detalle se oculta aquí hasta activar Pro.</p>
                        </>
                    ) : (
                        <p className="text-base">Pedidos ilimitados y reportes completos.</p>
                    )}
                </Section>

                <Button variant="ghost" className="text-muted-foreground" onClick={() => logout()}><IconSalir />Cerrar sesión</Button>
            </div>

            <div className="h-36" />
            <PublishBar store={store} />
            <StoreSettingsSheet open={editing} store={store} onClose={() => setEditing(false)} onSave={onSaveProfile} />
        </>
    );
}
