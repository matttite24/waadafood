"use client";

import { cn } from "@/lib/utils";
import {
    Clock,
    CheckCircle,
    Package,
    Truck,
    XCircle,
    ChatCircleDots,
    User,
    Phone
} from "@phosphor-icons/react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

export interface OrderItem {
    nombre: string;
    cantidad: number;
    precio: number;
}

export interface Order {
    _id: string;
    cliente_nombre?: string;
    cliente_telefono?: string;
    cliente_id?: string;
    estado: "pendiente" | "preparado" | "entregado" | "cancelado";
    detalles?: OrderItem[];
    resumen_pedido?: string;
    total?: number;
    _creationTime: number;
}

interface OrderCardProps {
    order: Order;
    onStatusChange: (id: string, newStatus: Order["estado"]) => void;
    onOpenChat: (clienteId: string) => void;
}

export function OrderCard({ order, onStatusChange, onOpenChat }: OrderCardProps) {
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const timeAgo = formatDistanceToNow(new Date(order._creationTime), {
        addSuffix: true,
        locale: es,
    });

    const statusConfig = {
        pendiente: {
            icon: Clock,
            label: "Pendiente",
            variant: "default" as const,
            className: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
            cardBg: "bg-amber-100/30",
            borderColor: "border-amber-200",
            nextStatus: "preparado" as const,
            nextLabel: "Preparar",
            nextIcon: Package,
            buttonColor: "bg-blue-600 hover:bg-blue-700 text-white",
        },
        preparado: {
            icon: Package,
            label: "En Preparación",
            variant: "default" as const,
            className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
            cardBg: "bg-blue-100/30",
            borderColor: "border-blue-200",
            nextStatus: "entregado" as const,
            nextLabel: "Entregar",
            nextIcon: Truck,
            buttonColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
        },
        entregado: {
            icon: CheckCircle,
            label: "Entregado",
            variant: "default" as const,
            className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
            cardBg: "bg-emerald-100/30",
            borderColor: "border-emerald-200",
            nextStatus: null,
            nextLabel: null,
            nextIcon: null,
        },
        cancelado: {
            icon: XCircle,
            label: "Cancelado",
            variant: "secondary" as const,
            className: "bg-muted text-muted-foreground hover:bg-muted",
            cardBg: "bg-muted/20",
            borderColor: "border-border",
            nextStatus: null,
            nextLabel: null,
            nextIcon: null,
        },
    };

    const config = statusConfig[order.estado];

    const formattedTotal = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(order.total || 0);

    return (
        <Card className={cn(
            "transition-all duration-200 hover:border-opacity-100",
            config.cardBg,
            config.borderColor,
            order.estado === "cancelado" && "opacity-60"
        )}>
            <CardHeader className="pb-3">
                {/* Order ID & Time */}
                <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                        Orden #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                            {timeAgo}
                        </p>
                        <p className="text-xs text-muted-foreground/60 tabular-nums">
                            {format(order._creationTime, "HH:mm")}
                        </p>
                    </div>
                </div>
                <Separator className="my-3" />
            </CardHeader>
            <CardContent className="pb-3">

                {/* Order Items */}
                <div className="space-y-2">
                    {order.detalles && order.detalles.length > 0 ? (
                        order.detalles.map((item, i) => (
                            <div key={i} className="flex justify-between items-baseline gap-2">
                                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                                    <span className="text-xs font-bold text-muted-foreground shrink-0">
                                        {item.cantidad}×
                                    </span>
                                    <span className="text-base font-semibold text-foreground truncate">
                                        {item.nombre}
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                                    ${(item.cantidad * item.precio).toLocaleString()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-foreground font-medium">
                            {order.resumen_pedido || "Sin detalles"}
                        </p>
                    )}
                </div>



                {/* Total */}
                <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-muted-foreground">
                        Total
                    </span>
                    <span className="text-xl font-bold text-foreground tabular-nums">
                        {formattedTotal}
                    </span>
                </div>

                {/* Client Info - Compact Row */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <User size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                        {order.cliente_nombre || "Cliente"}
                    </span>
                    {order.cliente_telefono && (
                        <>
                            <span className="text-muted-foreground/40">•</span>
                            <Phone size={14} className="text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground">
                                {order.cliente_telefono}
                            </span>
                        </>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex gap-2 pt-3">
                {/* Chat Button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onOpenChat(order.cliente_id!)}
                    disabled={!order.cliente_id}
                    className="shrink-0"
                >
                    <ChatCircleDots size={18} />
                </Button>

                {/* Status Action Button */}
                <div className="flex-1">
                    {config.nextStatus ? (
                        <Button
                            onClick={() => onStatusChange(order._id, config.nextStatus!)}
                            className={cn("w-full gap-2", config.buttonColor)}
                        >
                            {config.nextIcon && <config.nextIcon size={16} weight="bold" />}
                            <span>{config.nextLabel}</span>
                        </Button>
                    ) : order.estado === "entregado" ? (
                        <Button
                            variant="secondary"
                            className="w-full gap-2"
                            disabled
                        >
                            <CheckCircle size={16} weight="bold" />
                            <span>Completado</span>
                        </Button>
                    ) : null}
                </div>

                {/* Cancel Button */}
                {order.estado !== "cancelado" && order.estado !== "entregado" && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowCancelConfirm(true)}
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <XCircle size={18} />
                    </Button>
                )}
            </CardFooter>

            <ConfirmationDialog
                open={showCancelConfirm}
                onOpenChange={setShowCancelConfirm}
                onConfirm={() => {
                    onStatusChange(order._id, "cancelado");
                    setShowCancelConfirm(false);
                }}
                title="¿Cancelar pedido?"
                description={`¿Estás seguro de que deseas cancelar la orden #${order._id.slice(-6).toUpperCase()}? Esta acción no se puede deshacer.`}
                confirmText="Cancelar Pedido"
                variant="destructive"
            />
        </Card >
    );
}
