import {
    ChatCircleText,
    ChartDonut,
    Receipt,
    ForkKnife,
    Gear,
    House,
} from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
import { useComercio } from "@/hooks/useComercio";
import { cn } from "@/lib/utils";
import { useComercio } from "@/hooks/useComercio";
import { motion } from "framer-motion";
import { useComercio } from "@/hooks/useComercio";
import { useQuery } from "convex/react";
import { useComercio } from "@/hooks/useComercio";
import { api } from "@convex/_generated/api";
import { useComercio } from "@/hooks/useComercio";

const navItems = [
    { title: "Inicio", icon: House, url: "/overview" },
    { title: "Chats", icon: ChatCircleText, url: "/chats" },
    { title: "Pedidos", icon: Receipt, url: "/pedidos" },
    { title: "Métricas", icon: ChartDonut, url: "/metricas" },
    { title: "Menú", icon: ForkKnife, url: "/menu" },
    { title: "Ajustes", icon: Gear, url: "/configuracion" },
];

export function AppSidebar({ className }: { className?: string }) {
    const location = useLocation();
    const { comercio } = useComercio();
    const badgeCounts = useQuery(api.stats.getNavbarBadgeCounts, comercio ? { comercio_id: comercio._id } : "skip");

    const navItemsWithBadges = navItems.map(item => {
        let badge = 0;
        if (item.url === '/pedidos') badge = badgeCounts?.pendingOrders || 0;
        if (item.url === '/chats') badge = badgeCounts?.urgentChats || 0;
        return { ...item, badge };
    });

    return (
        <aside className={cn("flex flex-col items-center py-6 w-24 bg-transparent border-none h-full", className)}>

            {/* Logo */}
            <div className="shrink-0">
                <img
                    src="/logo_vertical.png"
                    alt="Logo"
                    className="w-10 h-auto object-contain"
                />
            </div>

            <nav className="flex-1 flex flex-col items-center justify-center gap-6 w-full">
                {navItemsWithBadges.map((item) => {
                    const isActive = location.pathname === item.url;

                    return (
                        <Link
                            key={item.title}
                            to={item.url}
                            className="group relative flex flex-col items-center justify-center gap-1.5 p-2 transition-all"
                        >
                            <div className={cn(
                                "relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                            )}>
                                <item.icon
                                    size={isActive ? 28 : 26}
                                    weight={isActive ? "fill" : "regular"}
                                    className="transition-transform duration-200"
                                />

                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-primary rounded-full -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                    />
                                )}

                                {item.badge > 0 && (
                                    <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 border-2 border-background shadow-sm">
                                        <span className="text-xs font-bold text-white leading-none">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <span className={cn(
                                "text-[11px] font-display font-bold tracking-tight transition-all duration-200 transform",
                                isActive
                                    ? "text-primary opacity-100 translate-y-0 scale-100"
                                    : "opacity-0 -translate-y-1 scale-95 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:text-primary/70"
                            )}>
                                {item.title}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
