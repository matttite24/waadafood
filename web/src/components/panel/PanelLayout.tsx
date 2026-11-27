import { useEffect, useRef } from "react";
import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { useConvexAuth, useQuery } from "convex/react";
import { Receipt, ForkKnife, ChartBar, UserCircle } from "@phosphor-icons/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import Registro from "@/pages/Registro";
import { cn } from "@/lib/utils";
import { notifyNewOrder, setBadge } from "@/lib/alerts";

export type Store = Doc<"stores">;
export const useStore = () => useOutletContext<Store>();

const TABS = [
    { to: "/pedidos", label: "Pedidos", Icon: Receipt },
    { to: "/menu", label: "Menú", Icon: ForkKnife },
    { to: "/reportes", label: "Reportes", Icon: ChartBar },
    { to: "/cuenta", label: "Cuenta", Icon: UserCircle },
];

function Spinner() {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
}

/** Carcasa del panel: barra inferior fija con 4 pestañas (spec §12.2). Pensada para 360 px y una mano. */
export default function PanelLayout() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    // Sin sesión validada por Convex, getMine devolvería null y se vería el registro por error.
    const store = useQuery(api.stores.getMine, isAuthenticated ? {} : "skip");
    const orders = useQuery(api.orders.listMine, isAuthenticated && store ? {} : "skip");

    // Pedido nuevo con el panel abierto: sonido, vibración, aviso y globo. La primera carga solo fija la línea base.
    const seen = useRef<Set<string> | null>(null);
    const newCount = orders?.filter((o) => o.status === "enviado").length ?? 0;
    useEffect(() => {
        if (!orders) return;
        if (seen.current === null) {
            seen.current = new Set(orders.map((o) => o._id));
            return;
        }
        const fresh = orders.filter((o) => !seen.current!.has(o._id));
        fresh.forEach((o) => seen.current!.add(o._id));
        if (fresh.length > 0) {
            notifyNewOrder();
            toast.success(`Pedido nuevo #${fresh[0].code}`);
        }
    }, [orders]);
    useEffect(() => { setBadge(newCount); }, [newCount]);

    if (isLoading || !isAuthenticated || store === undefined) return <Spinner />;
    if (store === null) return <Registro />;

    return (
        <div className="mx-auto min-h-screen max-w-md bg-background">
            <main className="p-4 pb-28">
                <Outlet context={store} />
            </main>
            <nav
                className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <ul className="mx-auto flex max-w-md">
                    {TABS.map(({ to, label, Icon }) => (
                        <li key={to} className="flex-1">
                            <NavLink
                                to={to}
                                className={({ isActive }) =>
                                    cn(
                                        "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                                        isActive ? "text-primary" : "text-muted-foreground",
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className="relative">
                                            <Icon size={26} weight={isActive ? "fill" : "regular"} />
                                            {to === "/pedidos" && newCount > 0 && (
                                                <span className="absolute -right-2 -top-1.5 min-w-5 rounded-full bg-destructive px-1 text-center text-[11px] font-bold leading-5 text-white">{newCount}</span>
                                            )}
                                        </span>
                                        {label}
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}
