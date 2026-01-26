import {
    X,
    UserCircle,
    Receipt as ReceiptIcon,
    CalendarBlank
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ContactPanelProps {
    selectedContact: any;
    clientDetail: any | undefined;
    onClose: () => void;
    onUpdateClient: (id: any, updates: any) => void;
    formatTime: (date?: string) => string;
}

export function ContactPanel({
    selectedContact,
    clientDetail,
    onClose,
    formatTime
}: Omit<ContactPanelProps, "onUpdateClient">) {
    if (!selectedContact) return null;

    const creationDate = new Date(selectedContact._creationTime);
    const formattedCreationDate = format(creationDate, "d 'de' MMMM, yyyy", { locale: es });

    return (
        <div className="flex-1 min-w-[320px] max-w-[380px] bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
            {/* Header section with basic info */}
            <div className="p-8 pb-6 flex flex-col items-center relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-3 h-8 w-8 rounded-full md:hidden"
                    onClick={onClose}
                >
                    <X size={16} />
                </Button>

                <Avatar className="h-28 w-28 mb-4 border-4 border-muted shadow-xl transition-transform hover:scale-105">
                    <AvatarFallback className="text-4xl bg-primary/5 text-primary font-display font-bold">
                        {selectedContact.nombre_usuario?.charAt(0) || <UserCircle size={56} />}
                    </AvatarFallback>
                </Avatar>

                <div className="text-center space-y-1.5">
                    <h3 className="font-display font-bold text-2xl leading-tight text-foreground tracking-tight">
                        {selectedContact.nombre_usuario || "Cliente Sin Nombre"}
                    </h3>
                    <p className="text-sm text-[#00754A] font-semibold">
                        {selectedContact.telefono}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 pt-2 text-[#94A3B8]">
                        <CalendarBlank size={14} />
                        <span className="text-[11px] font-medium">
                            Cliente desde: <span className="text-foreground/70">{formattedCreationDate}</span>
                        </span>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="px-6 pb-6 space-y-6">
                    <Separator className="opacity-40" />

                    {/* Tags section */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-muted-foreground/40">Etiquetas del Cliente</h4>
                        <div className="flex flex-wrap gap-2">
                            {clientDetail?.etiquetas && clientDetail.etiquetas.length > 0 ? (
                                clientDetail.etiquetas.map((tag: any) => (
                                    <Badge
                                        key={tag._id}
                                        className="rounded-lg border-none py-1 px-3 font-medium text-[11px] transition-all hover:opacity-80 shadow-none"
                                        style={{
                                            color: tag.color,
                                            backgroundColor: `${tag.color}15`
                                        }}
                                    >
                                        {tag.nombre}
                                    </Badge>
                                ))
                            ) : (
                                <div className="p-3 w-full rounded-2xl bg-muted/20 border border-dashed border-border/50 text-center">
                                    <p className="text-[11px] text-muted-foreground/60 font-medium italic">Sin etiquetas asignadas</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator className="opacity-40" />

                    {/* Stats section */}
                    {clientDetail ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10 transition-all hover:bg-primary/10">
                                    <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest block mb-1">Pedidos</span>
                                    <span className="text-2xl font-display font-bold text-primary tracking-tighter">{clientDetail.metrics.totalOrders}</span>
                                </div>
                                <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10 transition-all hover:bg-primary/10">
                                    <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest block mb-1">Gastado</span>
                                    <div className="flex items-baseline gap-0.5 text-primary">
                                        <span className="text-sm font-bold">$</span>
                                        <span className="text-2xl font-display font-bold tracking-tighter">{clientDetail.metrics.totalValue}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Orders section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-muted-foreground/40">Últimos Pedidos</h4>
                                    <Button variant="link" className="h-auto p-0 text-[10px] font-bold uppercase text-primary no-underline hover:underline">Ver todos</Button>
                                </div>
                                <div className="space-y-3">
                                    {clientDetail.orders.slice(0, 3).map((order: any) => (
                                        <div key={order._id} className="flex items-center gap-3.5 p-3 rounded-2xl border border-border/50 bg-card/50 hover:bg-card transition-all hover:border-primary/30 group cursor-pointer shadow-xs hover:shadow-md">
                                            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner shrink-0">
                                                <ReceiptIcon size={20} weight="bold" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className="text-sm font-bold tracking-tight text-foreground">${order.total}</span>
                                                    <span className="text-[9px] font-black opacity-30 uppercase tabular-nums text-muted-foreground">{formatTime(new Date(order._creationTime).toISOString())}</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground/80 truncate font-semibold uppercase tracking-tight">{order.resumen_pedido}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {clientDetail.orders.length === 0 && (
                                        <div className="p-4 w-full rounded-2xl bg-muted/20 border border-dashed border-border/50 text-center">
                                            <p className="text-[11px] text-muted-foreground/60 font-medium italic">No hay pedidos registrados</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-pulse">
                            <div className="h-20 w-full bg-muted/20 rounded-3xl" />
                            <div className="h-40 w-full bg-muted/20 rounded-3xl" />
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
