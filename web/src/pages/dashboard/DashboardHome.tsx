import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { CommandCards } from "@/components/dashboard/CommandCards";
import { AiImpactCard } from "@/components/dashboard/AiImpactCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AiWeeklyActivity } from "@/components/dashboard/AiWeeklyActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { useHeaderContent } from "@/hooks/use-header";
import { Button } from "@/components/ui/button";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useComercio } from "@/hooks/useComercio";

export default function DashboardHome() {
    const { comercio, isLoading: isComercioLoading } = useComercio();
    const stats = useQuery(api.dashboard.getOverviewStats, comercio ? { comercio_id: comercio._id } : "skip");
    const [isReloading, setIsReloading] = useState(false);

    const handleReload = () => {
        setIsReloading(true);
        // Simulate refresh
        setTimeout(() => {
            setIsReloading(false);
            toast.success("Dashboard actualizado");
        }, 1000);
    };

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

    useHeaderContent({
        right: rightContent
    });


    if (isComercioLoading || stats === undefined || !comercio) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 rounded-xl" />
                        <Skeleton className="h-4 w-48 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-8">
            <WelcomeHeader businessName={comercio.nombre_comercio} />

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 1. Actionable Items (Command Center) */}
                <CommandCards
                    urgentChatsCount={stats.urgentChatsCount}
                    pendingOrdersCount={stats.pendingOrdersCount}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    {/* 2. AI Impact (Value) & Chart - 2 columns */}
                    <div className="lg:col-span-2 space-y-8 min-w-0">
                        <AiImpactCard
                            iaSalesAttributed={stats.iaSalesAttributed}
                            hoursSaved={stats.hoursSaved}
                            iaEfficiency={stats.iaEfficiency}
                            todaySales={stats.todaySales}
                        />
                        <AiWeeklyActivity data={stats.weeklyAiChart as any[]} />
                    </div>

                    {/* 3. Live Activity Feed - 1 column */}
                    <div className="lg:col-span-1 h-full min-h-[300px]">
                        <ActivityFeed items={stats.activityFeed as any[]} />
                    </div>
                </div>
            </div>
        </div>
    );
}
