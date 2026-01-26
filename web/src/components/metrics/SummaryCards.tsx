"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ShoppingBag,
    User,
    Tag,
    Clock,
    ShoppingCart,
    TrendUp,
    Calendar
} from "@phosphor-icons/react";
import { Id } from "@convex/_generated/dataModel";
import { formatCurrency } from "@/../../shared/utils/formatters";

import { cn } from "@/lib/utils";

interface SummaryCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    children: React.ReactNode;
    className?: string;
}

function SummaryCard({ title, description, icon: Icon, children, className }: SummaryCardProps) {
    return (
        <Card className={cn("border-transparent shadow-sm bg-background/100 backdrop-blur-sm", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Icon size={20} weight="duotone" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold font-display">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

export function TopProductsCard({ products }: { products: any[] }) {
    return (
        <SummaryCard
            title="Mejores Ventas"
            description="Productos con mayor volumen"
            icon={ShoppingBag}
        >
            <div className="space-y-4">
                {products?.length > 0 ? (
                    products.map((prod: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-transparent transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                    {idx + 1}
                                </div>
                                <span className="font-bold text-foreground">{prod.nombre}</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                <span>{prod.cantidad}</span>
                                <TrendUp size={16} />
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-8 text-muted-foreground">Sin datos en este periodo</p>
                )}
            </div>
        </SummaryCard>
    );
}

export function TopClientsCard({ clients, onClientClick }: { clients: any[], onClientClick: (id: Id<"clientes">) => void }) {
    return (
        <SummaryCard
            title="Mejores Clientes"
            description="Clientes más frecuentes"
            icon={User}
        >
            <div className="space-y-4">
                {clients?.length > 0 ? (
                    clients.map((client: any, idx: number) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-transparent transition-all cursor-pointer hover:bg-muted/50"
                            onClick={() => client.id && onClientClick(client.id as Id<"clientes">)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
                                    {client.nombre.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-foreground">{client.nombre}</span>
                            </div>
                            <span className="font-black text-emerald-700">{formatCurrency(client.total)}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-8 text-muted-foreground">Sin clientes en este periodo</p>
                )}
            </div>
        </SummaryCard>
    );
}

export function TopCategoriesCard({ categories }: { categories: any[] }) {
    return (
        <SummaryCard
            title="Ganancia por Categoría"
            description="Distribución de ingresos"
            icon={Tag}
        >
            <div className="space-y-4">
                {categories?.length > 0 ? (
                    categories.map((cat: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-transparent transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                    <Tag size={16} />
                                </div>
                                <span className="font-bold text-foreground">{cat.nombre}</span>
                            </div>
                            <span className="font-black text-foreground">{formatCurrency(cat.total)}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-8 text-muted-foreground">Sin categorías registradas</p>
                )}
            </div>
        </SummaryCard>
    );
}

export function PeakHoursCard({ hours }: { hours: any[] }) {
    return (
        <SummaryCard
            title="Demanda por Horas"
            description="Picos de actividad"
            icon={Clock}
        >
            <div className="space-y-4">
                {hours?.length > 0 ? (
                    hours.map((h: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-transparent transition-all">
                            <div className="flex items-center gap-4">
                                <Calendar size={18} className="text-primary" />
                                <span className="font-bold text-foreground">{h.hora}:00 - {h.hora + 1}:00</span>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-foreground">
                                <span>{h.cantidad} pedidos</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-8 text-muted-foreground">Sin datos de horarios</p>
                )}
            </div>
        </SummaryCard>
    );
}

export function IncompleteSalesCard({ sales }: { sales: any[] }) {
    return (
        <SummaryCard
            title="Ventas Incompletas"
            description="Pedidos que no llegaron a confirmarse"
            icon={ShoppingCart}
            className="lg:col-span-2"
        >
            <div className="space-y-4">
                {sales?.length > 0 ? (
                    sales.map((draft: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-red-50/30 border border-red-100/50 hover:bg-red-50/50 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <ShoppingCart size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{draft.cliente_nombre || "Cliente Anónimo"}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{draft.resumen_pedido || "Sin resumen"}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-red-600">{formatCurrency(draft.total)}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-12 text-muted-foreground">¡No hay ventas incompletas en este periodo!</p>
                )}
            </div>
        </SummaryCard>
    );
}
