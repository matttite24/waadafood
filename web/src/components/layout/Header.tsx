import { Bell, CheckCircle, Warning, ChatCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge"; 
import { Separator } from "@/components/ui/separator";
import { useHeader } from "@/hooks/use-header";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";


export function Header() {
    const { centerContent, rightContent } = useHeader();
    const { userId } = useAuth();
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const notifications = useQuery(api.notifications.listItems, comercio ? { comercio_id: comercio._id } : "skip");

    return (
        <header className="w-full h-16 shrink-0 z-50 bg-transparent/0">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    {/* Logo removed - moved to sidebar */}
                </div>

                {/* Center: Dynamic Content (e.g. Filter Chips) */}
                <div className="flex-1 flex justify-center px-4">
                    {centerContent}
                </div>

                {/* Right: Search + Action + Notifications */}
                <div className="flex items-center gap-3">
                    {rightContent}

                    <div className="flex items-center ml-1">
                        <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 relative text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors duration-200">
                                    <Bell size={22} weight="regular" />
                                    {notifications && notifications.length > 0 && (
                                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-background" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 p-2 rounded-xl">
                                <DropdownMenuLabel className="font-display font-bold text-lg px-2">Notificaciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-[60vh] overflow-y-auto scrollbar-hide space-y-1">
                                    {notifications?.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground text-sm">
                                            Todo al día 🎉
                                        </div>
                                    ) : (
                                        notifications?.map((notif: any) => (
                                            <DropdownMenuItem key={notif.id} asChild>
                                                <Link to={notif.link} className="flex items-start gap-3 p-2 rounded-xl cursor-pointer">
                                                    <div className={`mt-1 p-1.5 rounded-full shrink-0 ${notif.type === 'chat_urgente' ? 'bg-red-100 text-red-600' :
                                                        notif.type === 'pedido_pendiente' ? 'bg-amber-100 text-amber-600' :
                                                            'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        {notif.type === 'chat_urgente' ? <Warning size={16} weight="fill" /> :
                                                            notif.type === 'pedido_pendiente' ? <CheckCircle size={16} weight="fill" /> :
                                                                <ChatCircle size={16} weight="fill" />}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="font-semibold text-sm leading-none">{notif.title}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.description}</p>
                                                        <p className="text-xs text-muted-foreground/60 font-medium">
                                                            {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: es })}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
}
