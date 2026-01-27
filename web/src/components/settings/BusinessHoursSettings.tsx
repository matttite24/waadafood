"use client";

import { Switch } from "@/components/ui/switch";
import { useComercio } from "@/hooks/useComercio";
import { Label } from "@/components/ui/label";
import { useComercio } from "@/hooks/useComercio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useComercio } from "@/hooks/useComercio";
import { Textarea } from "@/components/ui/textarea";
import { useComercio } from "@/hooks/useComercio";
import { Button } from "@/components/ui/button";
import { useComercio } from "@/hooks/useComercio";
import { Clock, Warning } from "@phosphor-icons/react";
import { useComercio } from "@/hooks/useComercio";
import { useQuery, useMutation } from "convex/react";
import { useComercio } from "@/hooks/useComercio";
import { api } from "@convex/_generated/api";
import { useComercio } from "@/hooks/useComercio";
import { useState, useEffect } from "react";
import { useComercio } from "@/hooks/useComercio";
import { toast } from "sonner";
import { useComercio } from "@/hooks/useComercio";
import { cn } from "@/lib/utils";
import { useComercio } from "@/hooks/useComercio";
import { Check } from "@phosphor-icons/react";
import { useComercio } from "@/hooks/useComercio";

interface DaySchedule {
    active: boolean;
    open: string;
    close: string;
}

interface ScheduleState {
    weekdays: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
    const h = i < 10 ? `0${i}` : i;
    return [`${h}:00`, `${h}:30`];
}).flat();

const TIME_LIMITS = [
    { value: "10", label: "10 min" },
    { value: "15", label: "15 min" },
    { value: "30", label: "30 min" },
];

export function BusinessHoursSettings() {
    const { comercio } = useComercio();
    const updateComercio = useMutation(api.comercios.update);

    const [schedule, setSchedule] = useState<ScheduleState>({
        weekdays: { active: true, open: '09:00', close: '18:00' },
        saturday: { active: true, open: '09:00', close: '14:00' },
        sunday: { active: false, open: '09:00', close: '18:00' },
    });
    const [notasHorario, setNotasHorario] = useState("");
    const [tiempoLimite, setTiempoLimite] = useState("15");
    const [saving, setSaving] = useState(false);

    // Parse initial schedule from comercio
    useEffect(() => {
        if (comercio) {
            setTiempoLimite((comercio.tiempo_limite_cierre || 15).toString());

            const horario = comercio.horario_atencion || "";
            if (horario && horario !== 'Cerrado temporalmente') {
                const newSchedule: ScheduleState = {
                    weekdays: { active: false, open: '09:00', close: '18:00' },
                    saturday: { active: false, open: '09:00', close: '14:00' },
                    sunday: { active: false, open: '09:00', close: '18:00' },
                };

                const parts = horario.split('|').map((p: string) => p.trim());
                parts.forEach((part: string) => {
                    if (part.includes('Lun-Vie:')) {
                        const times = part.replace('Lun-Vie:', '').trim().split('-');
                        if (times.length === 2) {
                            newSchedule.weekdays = { active: true, open: times[0], close: times[1] };
                        }
                    } else if (part.includes('Sáb:')) {
                        const times = part.replace('Sáb:', '').trim().split('-');
                        if (times.length === 2) {
                            newSchedule.saturday = { active: true, open: times[0], close: times[1] };
                        }
                    } else if (part.includes('Dom:')) {
                        const times = part.replace('Dom:', '').trim().split('-');
                        if (times.length === 2) {
                            newSchedule.sunday = { active: true, open: times[0], close: times[1] };
                        }
                    } else if (!part.includes(':')) {
                        // It's a note
                        setNotasHorario(part);
                    }
                });
                setSchedule(newSchedule);
            }
        }
    }, [comercio]);

    const updateSchedule = (day: keyof ScheduleState, field: keyof DaySchedule, value: string | boolean) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const formatScheduleString = (): string => {
        const parts = [];
        if (schedule.weekdays.active) parts.push(`Lun-Vie: ${schedule.weekdays.open}-${schedule.weekdays.close}`);
        if (schedule.saturday.active) parts.push(`Sáb: ${schedule.saturday.open}-${schedule.saturday.close}`);
        if (schedule.sunday.active) parts.push(`Dom: ${schedule.sunday.open}-${schedule.sunday.close}`);
        let h = parts.length === 0 ? 'Cerrado temporalmente' : parts.join(' | ');
        if (notasHorario.trim()) h += ` | ${notasHorario.trim()}`;
        return h;
    };

    const handleSave = async () => {
        if (!comercio) return;
        setSaving(true);
        try {
            await updateComercio({
                id: comercio._id,
                updates: {
                    horario_atencion: formatScheduleString(),
                    tiempo_limite_cierre: Number(tiempoLimite),
                }
            });
            toast.success("Horario guardado correctamente");
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const ScheduleRow = ({ label, day }: { label: string, day: keyof ScheduleState }) => (
        <div className="flex items-center justify-between py-3 border-b last:border-b-0">
            <div className="flex items-center gap-4 w-32">
                <Switch
                    checked={schedule[day].active}
                    onCheckedChange={(val) => updateSchedule(day, 'active', val)}
                    className="data-[state=checked]:bg-emerald-500"
                />
                <Label className={cn("font-medium", !schedule[day].active && "text-muted-foreground")}>
                    {label}
                </Label>
            </div>

            {schedule[day].active && (
                <div className="flex items-center gap-2 flex-1 justify-end max-w-sm animate-in fade-in duration-200">
                    <Select
                        value={schedule[day].open}
                        onValueChange={(val) => updateSchedule(day, 'open', val)}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {HOURS.map(h => <SelectItem key={`start-${h}`} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">-</span>
                    <Select
                        value={schedule[day].close}
                        onValueChange={(val) => updateSchedule(day, 'close', val)}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {HOURS.map(h => <SelectItem key={`end-${h}`} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );

    if (!comercio) return <div>Cargando...</div>;

    return (
        <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-black font-display tracking-tight">Horarios de Atención</h3>
                    <p className="text-sm text-muted-foreground">Configura cuándo está abierto tu negocio y límites de cierre.</p>
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

            {/* Horario Semanal */}
            <div className="space-y-4 border rounded-2xl p-6 bg-background/50">
                <div className="flex items-center justify-between pb-4 mb-2 border-b">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Clock size={18} className="text-primary" />
                        Horario Semanal
                    </h4>
                    <span className="text-xs text-muted-foreground">Formato 24h</span>
                </div>

                <ScheduleRow label="Lun-Vie" day="weekdays" />
                <ScheduleRow label="Sábado" day="saturday" />
                <ScheduleRow label="Domingo" day="sunday" />

                <div className="pt-4">
                    <Label className="text-sm">Notas adicionales</Label>
                    <Textarea
                        value={notasHorario}
                        onChange={(e) => setNotasHorario(e.target.value)}
                        placeholder="Ej: Cerrado los días festivos"
                        className="mt-2 resize-none"
                    />
                </div>

                {/* Preview */}
                <div className="p-4 bg-muted/30 rounded-xl mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Previsualización del horario
                    </p>
                    <p className="text-sm font-medium">{formatScheduleString()}</p>
                </div>
            </div>

            {/* Cierre de Pedidos */}
            <div className="space-y-4 p-6 border rounded-2xl bg-amber-50/50 border-amber-100">
                <div className="flex items-center gap-2">
                    <Warning size={20} className="text-amber-600" />
                    <h4 className="font-bold text-amber-900">Cierre de Pedidos</h4>
                </div>
                <p className="text-sm text-amber-800/80">
                    ¿Cuántos minutos antes del cierre dejas de recibir pedidos nuevos?
                </p>
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        {TIME_LIMITS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setTiempoLimite(opt.value)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                    tiempoLimite === opt.value
                                        ? "bg-amber-500 text-white shadow-md"
                                        : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-100"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
