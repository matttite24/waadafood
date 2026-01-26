"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@clerk/clerk-react";
import { useHeaderContent } from "@/hooks/use-header";
import { DateFilters, DateFilterType } from "@/components/pedidos/DateFilters";
import { OrderKanban } from "@/components/pedidos/OrderKanban";
import { ConversationSheet } from "@/components/pedidos/ConversationSheet";
import { Package, ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PedidosPage() {
    const { userId } = useAuth();
    const [filtroFecha, setFiltroFecha] = useState<DateFilterType>("hoy");
    const [selectedClienteId, setSelectedClienteId] = useState<Id<"clientes"> | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isReloading, setIsReloading] = useState(false);

    const handleReload = () => {
        setIsReloading(true);
        // Simulate refresh for UX
        setTimeout(() => {
            setIsReloading(false);
            toast.success("Datos sincronizados correctamente");
        }, 1000);
    };

    // 1. Get Commerce ID
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");

    // 2. Get Orders (dependent on commerce)
    const pedidos = useQuery(api.pedidos.list, comercio ? { comercio_id: comercio._id } : "skip");

    const updateStatus = useMutation(api.pedidos.updateStatus);

    const handleStatusChange = async (id: string, nuevoEstado: string) => {
        try {
            await updateStatus({ id: id as Id<"pedidos">, estado: nuevoEstado });
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    const handleOpenChat = (clienteId: string) => {
        setSelectedClienteId(clienteId as Id<"clientes">);
        setIsSheetOpen(true);
    };

    // Date filtering logic
    const filteredOrders = useMemo(() => {
        if (!pedidos) return [];

        const ahora = new Date();
        const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

        const inicioAyer = new Date(inicioHoy);
        inicioAyer.setDate(inicioAyer.getDate() - 1);

        const inicio7 = new Date(inicioHoy);
        inicio7.setDate(inicio7.getDate() - 7);

        const inicio30 = new Date(inicioHoy);
        inicio30.setDate(inicio30.getDate() - 30);

        const processed = pedidos.filter((p: any) => {
            const fecha = new Date(p._creationTime);

            if (filtroFecha === "hoy") return fecha >= inicioHoy;
            if (filtroFecha === "ayer") return fecha >= inicioAyer && fecha < inicioHoy;
            if (filtroFecha === "7dias") return fecha >= inicio7;
            if (filtroFecha === "30dias") return fecha >= inicio30;
            return true;
        });

        return processed as any[];
    }, [pedidos, filtroFecha]);

    const headerContent = useMemo(() => (
        <DateFilters
            selected={filtroFecha}
            onChange={setFiltroFecha}
        />
    ), [filtroFecha]);

    const rightContent = useMemo(() => (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleReload}
            className="h-10 w-10 rounded-full text-primary hover:bg-primary/10 hover:text-primary transition-colors"
            disabled={isReloading}
        >
            <ArrowsClockwise
                size={20}
                weight="bold"
                className={cn(isReloading && "animate-spin")}
            />
        </Button>
    ), [isReloading]);

    // Inject filters and reload button into Header
    useHeaderContent({
        center: headerContent,
        right: rightContent
    });

    if (pedidos === undefined || comercio === undefined) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative">
                    <Package size={48} className="text-primary/20 animate-pulse" />
                    <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
                </div>
                <p className="text-sm font-display font-medium text-muted-foreground animate-pulse">
                    Cargando pedidos...
                </p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-theme(spacing.16)-theme(spacing.12))] flex flex-col">
            <OrderKanban
                orders={filteredOrders}
                onStatusChange={handleStatusChange}
                onOpenChat={handleOpenChat}
            />

            <ConversationSheet
                clienteId={selectedClienteId}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />
        </div>
    );
}
