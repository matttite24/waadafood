"use client";

import {
    DrawerDescription,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Sparkle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import * as PhosphorIcons from "@phosphor-icons/react";
import { METRIC_DETAILS as SHARED_METRIC_DETAILS } from "@/../../shared/metricDefinitions";

const METRIC_DETAILS_UI = {
    "Total de Ventas": {
        color: "text-emerald-600",
        bgColor: "bg-emerald-500/10",
    },
    "Ticket Promedio": {
        color: "text-green-800",
        bgColor: "bg-green-800/10",
    },
    "Pedidos Creados": {
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
    },
    "Nuevos Clientes": {
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
    },
    "Conversión": {
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },
    "Eficiencia iA": {
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
    }
};

interface MetricDetailDrawerContentProps {
    metricTitle: string;
    filtroFecha: "hoy" | "ayer" | "7dias" | "30dias";
    currentValue: string;
}

export function MetricDetailDrawerContent({ metricTitle, filtroFecha, currentValue }: MetricDetailDrawerContentProps) {
    const sharedDef = SHARED_METRIC_DETAILS[metricTitle];
    const uiDef = METRIC_DETAILS_UI[metricTitle as keyof typeof METRIC_DETAILS_UI];

    if (!sharedDef || !uiDef) return null;

    const Icon = (PhosphorIcons as any)[sharedDef.iconName] || PhosphorIcons.TrendUp;

    return (
        <div className="mx-auto w-full max-w-4xl px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Lado Izquierdo: Resumen y Valor */}
                <div className="flex flex-col gap-8">
                    <div className="flex items-start gap-5">
                        <div className={cn(
                            "h-20 w-20 rounded-3xl flex items-center justify-center shrink-0 shadow-lg",
                            uiDef.bgColor,
                            uiDef.color
                        )}>
                            <Icon size={44} weight="duotone" />
                        </div>
                        <div className="space-y-2">
                            <DrawerTitle className="text-3xl font-black font-display text-[#1E3932] tracking-tight">
                                {metricTitle}
                            </DrawerTitle>
                            <DrawerDescription className="text-base font-medium text-muted-foreground/80 leading-relaxed">
                                {sharedDef.description}
                            </DrawerDescription>
                        </div>
                    </div>

                    <div className="p-10 rounded-[2.5rem] bg-muted/10 border border-border/5 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Valor en el periodo</span>
                        <div className="text-6xl font-black font-display text-foreground tracking-tighter">
                            {currentValue}
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Cálculo y Contexto */}
                <div className="space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-[#1E3932]/5 border border-[#1E3932]/10 space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-[#1E3932] uppercase tracking-[0.15em] flex items-center gap-2">
                                <Sparkle size={16} weight="bold" />
                                ¿Cómo se calcula?
                            </h4>
                            <div className="p-6 rounded-3xl bg-white/100 border border-border/5 shadow-sm">
                                <code className="text-sm font-bold font-mono text-primary leading-relaxed block text-center">
                                    {sharedDef.formula}
                                </code>
                            </div>
                        </div>

                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                            Este cálculo se genera automáticamente analizando tu historial de <span className="text-primary font-bold">{metricTitle.toLowerCase()}</span> para el periodo de <span className="text-primary font-bold">{filtroFecha === "hoy" ? "hoy" : filtroFecha === "ayer" ? "ayer" : `${filtroFecha.replace('dias', '')} días`}</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
