import { UserCircle, WarningCircle, Sparkle, User } from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatListItemProps {
    contact: any;
    isSelected: boolean;
    onSelect: () => void;
    formatTime: (date?: string) => string;
    tags: any[];
}

export function ChatListItem({ contact, isSelected, onSelect, formatTime, tags }: ChatListItemProps) {
    const lastMsgContent = contact.ultimo_mensaje_es_dueno
        ? `Tú: ${contact.ultimo_mensaje_contenido}`
        : contact.ultimo_mensaje_contenido;

    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full flex items-start gap-3.5 p-5 transition-all text-left border-b border-black/[0.04]",
                isSelected
                    ? "bg-[#D4E9E2]/30"
                    : "hover:bg-muted/30 bg-white dark:bg-transparent"
            )}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <Avatar className={cn(
                    "h-14 w-14 transition-all",
                    contact.asistente_activo
                        ? "bg-emerald-50"
                        : "bg-gray-100",
                    isSelected && contact.asistente_activo && "bg-emerald-100"
                )}>
                    <AvatarFallback className={cn(
                        "font-display font-black text-xl",
                        contact.asistente_activo
                            ? "text-emerald-600 bg-transparent"
                            : "text-gray-500 bg-transparent"
                    )}>
                        {contact.nombre_usuario?.charAt(0) || <UserCircle size={28} />}
                    </AvatarFallback>
                </Avatar>
                {contact.pedido_actual && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-[#F59E0B] border-[3px] border-white" />
                )}
            </div>

            {/* Content usando CSS Grid para layout robusto */}
            <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-start">
                {/* Fila 1 Col 1: Nombre */}
                <h3 className={cn(
                    "font-display font-bold text-[16px] leading-tight tracking-tight truncate",
                    isSelected ? "text-[#00754A]" : "text-[#1E3932]"
                )}>
                    {contact.nombre_usuario || contact.telefono}
                </h3>

                {/* Fila 1 Col 2: Hora */}
                <span className={cn(
                    "text-[9px] font-medium tabular-nums whitespace-nowrap text-right",
                    contact.isUnread ? "text-[#00754A] font-bold" : "text-[#94A3B8]"
                )}>
                    {formatTime(contact.ultimo_mensaje_fecha)}
                </span>

                {/* Fila 2 Col 1: Mensaje */}
                <p className={cn(
                    "text-[14px] leading-tight truncate",
                    contact.isUnread ? "text-[#1E3932] font-semibold" : "text-[#64748B] font-medium"
                )}>
                    {lastMsgContent || "Sin mensajes"}
                </p>

                <div className="flex items-center justify-end">
                    {contact.requiere_atencion_humana ? (
                        <Badge variant="destructive" className="px-2 py-0.5 gap-1 shadow-none text-[10px] font-medium border-none lowercase first-letter:uppercase">
                            <WarningCircle size={10} weight="fill" />
                            Urgente
                        </Badge>
                    ) : contact.asistente_activo ? (
                        <Badge className="bg-[#00754A] hover:bg-[#00754A]/90 text-white border-none px-2.5 py-1 gap-1.5 shadow-md shadow-emerald-500/10 text-[10px] font-bold transition-all hover:scale-105">
                            <Sparkle size={10} weight="fill" className="text-emerald-300" />
                            IA
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="px-2 py-0.5 gap-1 shadow-none text-[10px] font-medium border-none">
                            <User size={10} weight="fill" />
                            Humano
                        </Badge>
                    )}
                </div>

                {/* Fila 3: Tags (ocupa ambas columnas) */}
                {tags.length > 0 && (
                    <div className="col-span-2 flex flex-wrap items-center gap-1 mt-1">
                        {tags.map(tag => (
                            <Badge
                                key={tag._id}
                                className="border-none text-[10px] font-medium px-2 py-0 shadow-none hover:opacity-80"
                                style={{
                                    backgroundColor: `${tag.color}15`,
                                    color: tag.color,
                                }}
                            >
                                {tag.nombre}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Unread indicator */}
            {contact.isUnread && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-2 w-2 rounded-full bg-[#00754A]" />
                </div>
            )}
        </button>
    );
}
