"use client";

import { Order, OrderCard } from "./OrderCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Package, Clock, CheckCircle, XCircle } from "@phosphor-icons/react";

interface OrderKanbanProps {
    orders: Order[];
    onStatusChange: (id: string, newStatus: Order["estado"]) => void;
    onOpenChat: (clienteId: string) => void;
}

const COLUMNS: { id: Order["estado"]; label: string; icon: any; color: string }[] = [
    { id: "pendiente", label: "Pendientes", icon: Clock, color: "text-amber-500" },
    { id: "preparado", label: "En Preparación", icon: Package, color: "text-blue-500" },
    { id: "entregado", label: "Entregados", icon: CheckCircle, color: "text-emerald-500" },
    { id: "cancelado", label: "Cancelados", icon: XCircle, color: "text-rose-500" },
];

export function OrderKanban({ orders, onStatusChange, onOpenChat }: OrderKanbanProps) {
    return (
        <div className="flex gap-6 flex-1 min-h-0 overflow-x-auto pb-4 px-1 scrollbar-thin">
            {COLUMNS.map((column) => {
                const columnOrders = orders.filter((o) => o.estado === column.id);
                const Icon = column.icon;

                return (
                    <div
                        key={column.id}
                        className="flex flex-col flex-1 min-w-[320px]"
                    >
                        {/* Header Columna - Simplificado */}
                        <div className="flex items-center gap-2.5 mb-4 px-1">
                            <div className={cn("p-1.5 rounded-lg bg-background shadow-sm border border-border/50", column.color)}>
                                <Icon size={18} weight="bold" />
                            </div>
                            <h3 className="font-display font-bold text-base text-foreground">
                                {column.label}
                            </h3>
                            <span className="ml-auto bg-muted px-2.5 py-1 rounded-full text-xs font-bold text-muted-foreground">
                                {columnOrders.length}
                            </span>
                        </div>

                        {/* Contenido Columna */}
                        <ScrollArea className="flex-1">
                            <div className="space-y-3 pr-1">
                                {columnOrders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30">
                                        <Icon size={48} weight="thin" />
                                        <p className="text-xs font-medium mt-3 uppercase tracking-wide">Vacío</p>
                                    </div>
                                ) : (
                                    columnOrders.map((order) => (
                                        <OrderCard
                                            key={order._id}
                                            order={order}
                                            onStatusChange={onStatusChange}
                                            onOpenChat={onOpenChat}
                                        />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                );
            })}
        </div>
    );
}
