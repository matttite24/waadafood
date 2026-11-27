import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import { useConvexAuth, useQuery } from "convex/react";
import { Receipt, ForkKnife, ChartBar, UserCircle } from "@phosphor-icons/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import Registro from "@/pages/Registro";
import { cn } from "@/lib/utils";

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
                                        <Icon size={26} weight={isActive ? "fill" : "regular"} />
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
