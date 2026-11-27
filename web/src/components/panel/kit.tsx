import * as React from "react";
import { DrawerClose, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconCerrar } from "@/components/icons";

/** Tarjeta con título opcional: el bloque básico de cualquier pantalla. */
export function Section({ title, icon, action, className, children }: {
    title?: string; icon?: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
    return (
        <section className={cn("rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", className)}>
            {(title || action) && (
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 font-semibold [&_svg]:size-5 [&_svg]:text-muted-foreground">{icon}{title}</h2>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

export function Spinner({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center justify-center py-20", className)} role="status" aria-label="Cargando">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
}

/** Estado vacío con ícono y, si ayuda, un botón de acción. */
export function Empty({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
            <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-7">{icon}</div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}

/** Botón de solo ícono: SIEMPRE lleva `label` (lo leen los lectores de pantalla) y mide 48 px. */
export function IconButton({ label, className, children, ...rest }: { label: string } & React.ComponentProps<typeof Button>) {
    return (
        <Button variant="ghost" size="icon" aria-label={label} title={label} className={className} {...rest}>
            {children}
        </Button>
    );
}

/** Encabezado de hoja inferior: título, subtítulo opcional y botón de cerrar visible. */
export function SheetHead({ title, subtitle }: { title: React.ReactNode; subtitle?: React.ReactNode }) {
    return (
        <DrawerHeader className="flex items-start justify-between gap-3 pb-2 text-left">
            <div className="min-w-0">
                <DrawerTitle className="truncate text-xl">{title}</DrawerTitle>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <DrawerClose asChild>
                <IconButton label="Cerrar" className="-mr-2 -mt-2 shrink-0"><IconCerrar /></IconButton>
            </DrawerClose>
        </DrawerHeader>
    );
}

const STATUS: Record<string, string> = {
    enviado: "bg-amber-100 text-amber-900",
    confirmado: "bg-blue-100 text-blue-900",
    entregado: "bg-emerald-100 text-emerald-900",
    cancelado: "bg-red-100 text-red-900",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
    return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS[status] ?? "bg-muted")}>{label}</span>;
}
