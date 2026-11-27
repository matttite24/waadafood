import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { useConvexAuth, useQuery } from "convex/react";
import { IconPedidos, IconMenu, IconReportes, IconCuenta } from "@/components/icons";
import { Spinner } from "./kit";
import { hasUnpublished } from "./PublishBar";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import Registro from "@/pages/Registro";
import { cn } from "@/lib/utils";
import { notifyNewOrder, setBadge } from "@/lib/alerts";

export type Store = Doc<"stores">;
export const useStore = () => useOutletContext<Store>();

const TABS = [
    { to: "/pedidos", label: "Pedidos", Icon: IconPedidos },
    { to: "/menu", label: "Menú", Icon: IconMenu },
    { to: "/reportes", label: "Reportes", Icon: IconReportes },
    { to: "/cuenta", label: "Cuenta", Icon: IconCuenta },
];

/** Logo del app: se carga de /logo.svg (web/public/logo.svg). Si el archivo no existe aún, muestra el nombre. */
function Logo() {
    const [missing, setMissing] = useState(false);
    if (missing) return <span className="text-base font-extrabold tracking-tight text-primary">Waada</span>;
    return <img src="/logo.svg" alt="Waada" className="h-5 w-auto" onError={() => setMissing(true)} />;
}

/** Carcasa del panel: barra inferior fija con 4 pestañas (spec §12.2). Pensada para 360 px y una mano. */
export default function PanelLayout() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const { pathname } = useLocation();
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

    if (isLoading || !isAuthenticated || store === undefined) return <Spinner className="h-screen py-0" />;
    if (store === null) return <Registro />;

    return (
        <div className="mx-auto min-h-screen max-w-md bg-background">
            <header
                className="sticky top-0 z-30 flex items-center justify-center border-b border-black/5 bg-background/90 px-4 backdrop-blur-md"
                style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(56px + env(safe-area-inset-top))" }}
            >
                <Logo />
            </header>
            <main key={pathname} className="p-4 pb-32 animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
                <Outlet context={store} />
            </main>
            {/* Barra flotante tipo píldora: sombra suave y separada de los bordes (respeta el área segura del iPhone). */}
            <nav
                aria-label="Secciones"
                className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
            >
                <ul className="pointer-events-auto flex w-full max-w-sm gap-1 rounded-full border border-black/5 bg-background/90 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
                    {TABS.map(({ to, label, Icon }) => (
                        <li key={to} className="flex-1">
                            <NavLink
                                to={to}
                                className={({ isActive }) =>
                                    cn(
                                        "flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition-colors",
                                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground",
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className="relative">
                                            <Icon size={24} weight={isActive ? "fill" : "regular"} />
                                            {to === "/menu" && hasUnpublished(store) && (
                                                <span aria-label="Cambios sin publicar" className="absolute -right-1 -top-0.5 size-2.5 rounded-full bg-amber-500 ring-2 ring-background" />
                                            )}
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
