"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Robot, Sparkle, Warning } from "@phosphor-icons/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Check, Play } from "@phosphor-icons/react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { SandboxChat } from "./SandboxChat";

export function AiSettings() {
    const { user } = useKindeAuth();
    const userId = user?.id;
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const updateComercio = useMutation(api.comercios.update);

    const [iaActiva, setIaActiva] = useState(true);
    const [nombreBot, setNombreBot] = useState("");
    const [personalidad, setPersonalidad] = useState("");
    const [directrices, setDirectrices] = useState("");
    const [reglasEscalacion, setReglasEscalacion] = useState("");
    const [iaEstilo, setIaEstilo] = useState("amigable");
    const [saving, setSaving] = useState(false);
    const [showDisableConfirm, setShowDisableConfirm] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    useEffect(() => {
        if (comercio) {
            setIaActiva(comercio.ia_activa ?? true);
            setNombreBot(comercio.nombre_asistente ?? "Asistente");
            setPersonalidad(comercio.prompt_personalidad ?? "");
            setDirectrices(comercio.directrices_comunicacion ?? "");
            setReglasEscalacion(comercio.reglas_escalacion ?? "");
            setIaEstilo(comercio.ia_estilo ?? "amigable");
        }
    }, [comercio]);

    const handleToggleIA = async (value: boolean) => {
        if (!comercio) return;

        if (value === false) {
            setShowDisableConfirm(true);
            return;
        }

        await updateIAStatus(true);
    };

    const updateIAStatus = async (value: boolean) => {
        if (!comercio) return;
        setIsUpdatingStatus(true);
        setIaActiva(value);
        try {
            await updateComercio({
                id: comercio._id,
                updates: { ia_activa: value }
            });
            toast.success(value ? "IA Activada" : "IA Desactivada");
        } catch (error) {
            toast.error("Error al guardar");
            setIaActiva(!value); // Revert if error
        } finally {
            setIsUpdatingStatus(false);
            setShowDisableConfirm(false);
        }
    };

    const handleSave = async () => {
        if (!comercio) return;
        setSaving(true);
        try {
            await updateComercio({
                id: comercio._id,
                updates: {
                    nombre_asistente: nombreBot,
                    prompt_personalidad: personalidad,
                    directrices_comunicacion: directrices,
                    reglas_escalacion: reglasEscalacion,
                    ia_estilo: iaEstilo,
                }
            });
            toast.success("Configuración IA guardada");
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (!comercio) return <div>Cargando...</div>;

    return (
        <div className="space-y-8 max-w-3xl animate-in fade-in duration-500 pb-10">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-black font-display tracking-tight">Asistente IA</h3>
                    <p className="text-sm text-muted-foreground">Configura la personalidad y comportamiento de tu asistente.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="gap-2 shadow-sm px-6 border-primary/20 text-primary hover:bg-primary/5 h-10 rounded-full">
                                <Play size={18} weight="fill" />
                                Probar IA
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 w-full sm:max-w-md border-none">
                            <SandboxChat comercioId={comercio._id} />
                        </SheetContent>
                    </Sheet>

                    <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg px-6 bg-[#00754A] hover:bg-[#00754A]/90 h-10 rounded-full">
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
            </div>

            <div className="grid gap-6">
                {/* Estado del Asistente */}
                <div className="flex items-center justify-between p-6 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold font-display text-emerald-700">Estado del Asistente</h3>
                            <Badge variant={iaActiva ? "default" : "destructive"} className={cn(iaActiva ? "bg-emerald-500 hover:bg-emerald-600" : "")}>
                                {iaActiva ? "ACTIVO" : "INACTIVO"}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {iaActiva ? 'La IA está respondiendo mensajes automáticamente.' : 'La IA está desactivada, no responderá mensajes.'}
                        </p>
                    </div>
                    <Switch
                        checked={iaActiva}
                        onCheckedChange={handleToggleIA}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                </div>

                {/* Identidad */}
                <div className="space-y-4 p-6 border rounded-2xl bg-background/50">
                    <h3 className="text-lg font-bold font-display flex items-center gap-2">
                        <Robot size={20} className="text-purple-500" />
                        Identidad y Tono
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Nombre del Asistente</Label>
                            <Input
                                value={nombreBot}
                                onChange={(e) => setNombreBot(e.target.value)}
                                placeholder="Ej: Ana, Bot de Pedidos..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tono de Respuesta</Label>
                            <Select value={iaEstilo} onValueChange={setIaEstilo}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona un tono" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="amigable">🌟 Amigable (Recomendado)</SelectItem>
                                    <SelectItem value="profesional">💼 Profesional y Ejecutivo</SelectItem>
                                    <SelectItem value="relajado">😎 Relajado / Callejero</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Personalidad y Comportamiento */}
                <div className="space-y-4 p-6 border rounded-2xl bg-background/50">
                    <h3 className="text-lg font-bold font-display flex items-center gap-2">
                        <Sparkle size={20} className="text-amber-500" />
                        Comportamiento
                    </h3>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Personalidad</Label>
                            <Textarea
                                className="min-h-[100px]"
                                placeholder="Describe cómo debe comportarse. Ej: Eres un mesero amable y divertido. Usas emojis de comida."
                                value={personalidad}
                                onChange={(e) => setPersonalidad(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Estilo de Comunicación</Label>
                            <Textarea
                                className="min-h-[100px]"
                                placeholder="Reglas de negocio. Ej: No aceptamos pagos con cheque. El delivery tarda 45 min."
                                value={directrices}
                                onChange={(e) => setDirectrices(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Reglas de Escalación */}
                <div className="space-y-4 p-6 border rounded-2xl bg-background/50">
                    <h3 className="text-lg font-bold font-display flex items-center gap-2">
                        <Warning size={20} className="text-red-500" />
                        Auto-pausa (Escalación)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Situaciones donde la IA debe detenerse y pasarte el chat.
                    </p>
                    <div className="grid gap-2">
                        <Label>Reglas Personalizadas</Label>
                        <Textarea
                            className="min-h-[100px]"
                            placeholder="Ej: Si el cliente usa groserías, si no entiende el menú, si pide hablar con un humano..."
                            value={reglasEscalacion}
                            onChange={(e) => setReglasEscalacion(e.target.value)}
                        />
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                        <Robot size={18} className="text-emerald-600 mt-0.5" />
                        <p className="text-xs text-emerald-800 font-medium">
                            Detección de emociones activa por defecto: La IA escalará automáticamente si detecta clientes molestos o agresivos.
                        </p>
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                open={showDisableConfirm}
                onOpenChange={setShowDisableConfirm}
                onConfirm={() => updateIAStatus(false)}
                title="¿Apagar el Asistente IA?"
                description="Al desactivar la IA, el sistema dejará de responder automáticamente a tus clientes. Tendrás que gestionar todos los chats manualmente hasta que la vuelvas a activar."
                confirmText="Apagar Asistente"
                variant="destructive"
                loading={isUpdatingStatus}
            />
        </div>
    );
}
