"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useHeaderContent } from "@/hooks/use-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ConversationSheet } from "@/components/pedidos/ConversationSheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { TrendUp, ArrowsClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Shared logic & components
import { METRIC_DETAILS as SHARED_METRIC_DETAILS } from "@/../../shared/metricDefinitions";
import { formatCurrency } from "@/../../shared/utils/formatters";
import { MetricCard } from "@/components/metrics/MetricCard";
import { MetricDetailDrawerContent } from "@/components/metrics/MetricDetailDrawerContent";
import {
    TopProductsCard,
    TopClientsCard,
    TopCategoriesCard,
    PeakHoursCard,
    IncompleteSalesCard
} from "@/components/metrics/SummaryCards";

export default function MetricsPage() {
    const { user } = useKindeAuth();
    const userId = user?.id;
    const [filtroFecha, setFiltroFecha] = useState<"hoy" | "ayer" | "7dias" | "30dias">("hoy");
    const [selectedClienteId, setSelectedClienteId] = useState<Id<"clientes"> | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const metrics = useQuery(api.metrics.getSummary,
        comercio ? { comercio_id: comercio._id, filtro: filtroFecha } : "skip"
    );

    const handleMetricClick = (metricTitle: string) => {
        setSelectedMetric(metricTitle);
        setIsDrawerOpen(true);
    };

    const handleReload = () => {
        setIsReloading(true);
        setTimeout(() => {
            setIsReloading(false);
            toast.success("Métricas actualizadas");
        }, 1000);
    };

    // Header Content
    const headerContent = useMemo(() => (
        <SegmentedControl
            options={[
                { label: "Hoy", value: "hoy" },
                { label: "Ayer", value: "ayer" },
                { label: "7 días", value: "7dias" },
                { label: "30 días", value: "30dias" },
            ]}
            value={filtroFecha}
            onValueChange={(val) => setFiltroFecha(val as any)}
        />
    ), [filtroFecha]);

    const rightContent = useMemo(() => (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleReload}
            className="h-10 w-10 rounded-full text-primary hover:bg-primary/10 transition-colors"
            disabled={isReloading}
        >
            <ArrowsClockwise size={20} weight="bold" className={cn(isReloading && "animate-spin")} />
        </Button>
    ), [isReloading]);

    useHeaderContent({ center: headerContent, right: rightContent });

    if (!metrics || !comercio) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative">
                    <TrendUp size={48} className="text-primary/20 animate-pulse" />
                    <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
                </div>
                <p className="text-sm font-display font-medium text-muted-foreground animate-pulse">
                    Calculando métricas...
                </p>
            </div>
        );
    }

    const metricCardsData = [
        { title: "Total de Ventas", value: formatCurrency(metrics.revenue || 0) },
        { title: "Ticket Promedio", value: formatCurrency(metrics.averageTicket || 0) },
        { title: "Pedidos Creados", value: (metrics.orderCount || 0).toString() },
        { title: "Nuevos Clientes", value: (metrics.newClients || 0).toString() },
        { title: "Conversión", value: `${(metrics.conversionRate || 0).toFixed(1)}%` },
        { title: "Eficiencia iA", value: `${(metrics.iaEfficiency || 0).toFixed(1)}%` },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Grid de Métricas Principales */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {metricCardsData.map((data) => {
                    const shared = SHARED_METRIC_DETAILS[data.title];
                    return (
                        <MetricCard
                            key={data.title}
                            title={data.title}
                            value={data.value}
                            iconName={shared.iconName}
                            color={shared.color}
                            bgColor={shared.bgColor}
                            onClick={() => handleMetricClick(data.title)}
                        />
                    );
                })}
            </div>

            {/* Grid de Resúmenes Detallados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TopProductsCard products={metrics.topProducts} />
                <TopClientsCard
                    clients={metrics.topClients}
                    onClientClick={(id) => {
                        setSelectedClienteId(id);
                        setIsSheetOpen(true);
                    }}
                />
                <TopCategoriesCard categories={metrics.topCategories} />
                <PeakHoursCard hours={metrics.peakHours} />
                <IncompleteSalesCard sales={metrics.incompleteSales} />
            </div>

            <ConversationSheet
                clienteId={selectedClienteId}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    {isDrawerOpen && selectedMetric && (
                        <MetricDetailDrawerContent
                            metricTitle={selectedMetric}
                            filtroFecha={filtroFecha}
                            currentValue={metricCardsData.find(c => c.title === selectedMetric)?.value || "---"}
                        />
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}
