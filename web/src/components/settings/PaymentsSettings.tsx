import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bank, Money } from "@phosphor-icons/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, Robot } from "@phosphor-icons/react";

export function PaymentsSettings() {
    const { userId } = useAuth();
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const updateComercio = useMutation(api.comercios.update);

    const [efectivo, setEfectivo] = useState(false);
    const [transferencia, setTransferencia] = useState(false);
    const [instrucciones, setInstrucciones] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (comercio) {
            setEfectivo(comercio.pago_efectivo ?? false);
            setTransferencia(comercio.pago_transferencia ?? false);
            setInstrucciones(comercio.instrucciones_pago ?? "");
        }
    }, [comercio]);

    const handleSave = async () => {
        if (!comercio) return;
        setSaving(true);

        try {
            await updateComercio({
                id: comercio._id,
                updates: {
                    pago_efectivo: efectivo,
                    pago_transferencia: transferencia,
                    instrucciones_pago: instrucciones
                }
            });
            toast.success("Configuración de pagos guardada");
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (!comercio) return <div>Cargando...</div>;

    return (
        <div className="space-y-8 max-w-2xl animate-in fade-in duration-500 pb-10">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-black font-display tracking-tight">Métodos de Pago</h3>
                    <p className="text-sm text-muted-foreground">Define cómo pueden pagarte tus clientes.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="rounded-full gap-2 shadow-lg px-6 bg-[#00754A] hover:bg-[#00754A]/90 h-10">
                    {saving ? (
                        "Guardando..."
                    ) : (
                        <>
                            <Check size={18} weight="bold" />
                            Guardar
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-background shadow-sm hover:border-emerald-200 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
                            <Money size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold">Efectivo</h4>
                            <p className="text-sm text-muted-foreground">Aceptar pagos contra entrega.</p>
                        </div>
                    </div>
                    <Switch
                        checked={efectivo}
                        onCheckedChange={setEfectivo}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-xl bg-background shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                            <Bank size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold">Transferencia Bancaria</h4>
                            <p className="text-sm text-muted-foreground">Mostrar datos bancarios al finalizar.</p>
                        </div>
                    </div>
                    <Switch
                        checked={transferencia}
                        onCheckedChange={setTransferencia}
                    />
                </div>
            </div>

            {transferencia && (
                <div className="space-y-4 animate-in slide-in-from-top-2 border rounded-2xl p-6 bg-background/50">
                    <Label htmlFor="instrucciones" className="text-base font-bold">Instrucciones de Transferencia</Label>
                    <Textarea
                        id="instrucciones"
                        placeholder="Ej:&#10;Banco: XYZ&#10;CLABE: 1234567890&#10;Titular: Mi Pizzería"
                        className="min-h-[140px] font-mono text-sm bg-background border-muted-foreground/20"
                        value={instrucciones}
                        onChange={(e) => setInstrucciones(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Estos datos se enviarán automáticamente al cliente cuando elija pagar por transferencia.
                    </p>
                </div>
            )}

            {/* AI Preview Section */}
            <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                        <Robot size={20} weight="fill" />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-900">Previsualización de IA</h4>
                        <p className="text-xs text-indigo-800/70">Así es como el asistente explicará los pagos:</p>
                    </div>
                </div>

                <div className="bg-white/80 p-4 rounded-xl border border-indigo-100 shadow-sm italic text-sm text-indigo-900 leading-relaxed">
                    {!efectivo && !transferencia ? (
                        "No se han definido métodos de pago. El asistente indicará que debe consultarlo directamente."
                    ) : (
                        <>
                            "Aceptamos pagos en {efectivo ? 'efectivo al recibir tu pedido' : ''}
                            {efectivo && transferencia ? ' y también ' : ''}
                            {transferencia ? 'transferencia bancaria' : ''}.
                            {transferencia ? ` Al finalizar, te proporcionaré los datos: ${instrucciones.split('\n')[0]}...` : ''}"
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
