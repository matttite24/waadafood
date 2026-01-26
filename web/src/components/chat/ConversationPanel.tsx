import { useRef, useEffect, useState } from "react";
import {
    TrayArrowDown,
    TrayArrowUp,
    ChatCircleText,
    Tag,
    Sparkle
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { TagsModal } from "./TagsModal";
import { ChatInput } from "./ChatInput";
import { MessageImage } from "./MessageImage";
import { ChatBackground } from "./ChatBackground";
import { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

interface ConversationPanelProps {
    selectedContact: any | null | undefined;
    messages: any[] | undefined;
    onSendMessage: (text: string, imageIds?: string[]) => void;
    onToggleInfoPanel: () => void;
    onUpdateClient: (id: Id<"clientes">, updates: any) => void;
    formatTime: (date?: string) => string;
    availableTags: any[] | undefined;
    comercioId?: Id<"comercios">;
}

export function ConversationPanel({
    selectedContact,
    messages,
    onSendMessage,
    onToggleInfoPanel,
    onUpdateClient,
    formatTime,
    availableTags,
    comercioId
}: ConversationPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [messageText, setMessageText] = useState("");
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [showTagsModal, setShowTagsModal] = useState(false);

    // Mutation to generate upload URL
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const uploadImages = async (base64Images: string[]) => {
        const uploadResults = await Promise.all(
            base64Images.map(async (base64) => {
                // 1. Get upload URL
                const postUrl = await generateUploadUrl();

                // 2. Convert base64 to blob
                const response = await fetch(base64);
                const blob = await response.blob();

                // 3. Post to Convex Storage
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type },
                    body: blob,
                });

                const { storageId } = await result.json();
                return storageId;
            })
        );
        return uploadResults;
    };

    const handleSend = async (text: string, images: string[]) => {
        let imageIds: string[] | undefined = undefined;

        if (images.length > 0) {
            try {
                imageIds = await uploadImages(images);
            } catch (error) {
                console.error("Error uploading images:", error);
            }
        }

        onSendMessage(text, imageIds);
        setMessageText("");
        setSelectedImages([]);
    };

    const handleToggleTag = async (tagId: Id<"etiquetas">) => {
        if (!selectedContact) return;

        const currentTags = selectedContact.etiquetas_ids || [];
        const newTags = currentTags.includes(tagId)
            ? currentTags.filter((id: string) => id !== tagId)
            : [...currentTags, tagId];

        onUpdateClient(selectedContact._id, { etiquetas_ids: newTags });
    };

    if (!selectedContact) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-muted/5 rounded-2xl border border-dashed border-border/50 text-muted-foreground">
                <div className="p-8 rounded-full bg-muted/10 mb-6 group-hover:scale-110 transition-transform">
                    <ChatCircleText size={64} weight="thin" className="opacity-20" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-display font-bold text-foreground/40">Tu conversación aparecerá aquí</h3>
                    <p className="text-sm max-w-[280px] leading-relaxed opacity-60">Selecciona un contacto de la lista de la izquierda para comenzar a chatear.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-w-[500px] flex flex-col bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden relative">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 h-16 border-b border-border/10 flex items-center justify-between px-6 bg-background/60 backdrop-blur-xl z-20 font-display shadow-sm rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <Avatar
                        className="h-11 w-11 border border-border/50 shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                        onClick={onToggleInfoPanel}
                    >
                        <AvatarFallback className="bg-primary/5 text-primary text-base font-bold">
                            {selectedContact?.nombre_usuario?.charAt(0) || "?"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-sm leading-none flex items-center gap-2 text-foreground">
                            {selectedContact?.nombre_usuario || "Sin nombre"}
                            {selectedContact?.archivado && (
                                <Badge variant="secondary" className="text-[8px] h-4 py-0 font-black tracking-widest uppercase bg-muted text-muted-foreground border-none">
                                    Archivado
                                </Badge>
                            )}
                        </h3>
                        <span className="text-[11px] text-muted-foreground mt-1 font-medium">
                            {selectedContact?.telefono}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Etiquetar */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl h-11 w-11 hover:bg-primary/5 hover:text-primary transition-colors duration-200"
                        onClick={() => setShowTagsModal(true)}
                    >
                        <Tag size={24} weight="bold" />
                    </Button>

                    {/* Archivar */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "rounded-xl h-11 w-11 transition-colors duration-200",
                            selectedContact.archivado ? "text-orange-500 bg-orange-50 hover:bg-orange-100" : "hover:bg-primary/5 hover:text-primary"
                        )}
                        onClick={() => onUpdateClient(selectedContact._id, { archivado: !selectedContact.archivado })}
                        title={selectedContact.archivado ? "Desarchivar" : "Archivar"}
                    >
                        {selectedContact.archivado ? (
                            <TrayArrowUp size={24} weight="bold" />
                        ) : (
                            <TrayArrowDown size={24} weight="bold" />
                        )}
                    </Button>

                    {/* Separador */}
                    <Separator orientation="vertical" className="h-8 mx-1" />

                    {/* Estado IA - Simplificado */}
                    <div className="flex items-center gap-2">
                        <Sparkle size={18} weight="fill" className={cn(selectedContact.asistente_activo ? "text-primary" : "text-muted-foreground/40")} />
                        <span className={cn("text-xs font-semibold", selectedContact.asistente_activo ? "text-primary" : "text-muted-foreground")}>
                            Agente iA
                        </span>
                        <Switch
                            checked={selectedContact.asistente_activo}
                            onCheckedChange={(checked) => onUpdateClient(selectedContact._id, { asistente_activo: checked })}
                        />
                    </div>
                </div>
            </header>

            {/* Tags Modal */}
            <TagsModal
                open={showTagsModal}
                onOpenChange={setShowTagsModal}
                availableTags={availableTags}
                selectedTagIds={selectedContact.etiquetas_ids || []}
                onToggleTag={handleToggleTag}
            />

            {/* Messages Area */}
            <ScrollArea
                className="flex-1 relative"
                ref={scrollRef}
            >
                {/* Background Pattern */}
                <ChatBackground />

                <div className="flex flex-col gap-1 p-6 relative z-10">
                    {/* Header Spacer for absolute header */}
                    <div className="h-20" />

                    {messages?.map((msg, index) => {
                        const isClient = !msg.es_ia && !msg.es_dueno;
                        const isAI = msg.es_ia;
                        const isOwner = msg.es_dueno;

                        // Determinar si es el último mensaje de un bloque del mismo tipo
                        const nextMsg = messages[index + 1];
                        const showAvatar = isClient && (
                            !nextMsg ||
                            (nextMsg.es_ia || nextMsg.es_dueno)
                        );

                        return (
                            <div
                                key={msg._id || index}
                                className={cn(
                                    "flex items-end gap-3 mb-1",
                                    (isAI || isOwner) ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className="w-8 flex-shrink-0">
                                    {showAvatar && isClient && (
                                        <Avatar className="h-8 w-8 border border-border/40 shadow-sm">
                                            <AvatarFallback className="bg-muted text-[10px] font-bold">
                                                {selectedContact.nombre_usuario?.charAt(0) || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>

                                <div
                                    className={cn(
                                        "max-w-[70%] w-fit rounded-2xl p-3.5 text-sm shadow-sm transition-all",
                                        isClient && "bg-white border border-border/40 rounded-tl-sm text-foreground",
                                        isAI && "bg-[#059669] text-white rounded-tr-sm",
                                        isOwner && "bg-[#243932] text-white rounded-tr-sm"
                                    )}
                                >
                                    <div className="flex flex-col gap-2">
                                        {msg.imagenes && msg.imagenes.length > 0 && (
                                            <div className="grid grid-cols-1 gap-2 mb-1">
                                                {msg.imagenes.map((storageId: string) => (
                                                    <MessageImage
                                                        key={storageId}
                                                        storageId={storageId}
                                                        className="rounded-lg max-h-72 w-full object-contain"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {msg.contenido && <p className="leading-relaxed whitespace-pre-wrap">{msg.contenido}</p>}

                                        <div className={cn(
                                            "flex items-center gap-1.5 mt-1",
                                            (isAI || isOwner) ? "justify-end" : "justify-start"
                                        )}>
                                            <span className={cn(
                                                "text-[10px] opacity-50 font-medium",
                                                (isAI || isOwner) ? "text-white/80" : "text-muted-foreground"
                                            )}>
                                                {formatTime(msg._creationTime ? new Date(msg._creationTime).toISOString() : undefined)}
                                            </span>
                                            {isAI && (
                                                <Badge className="bg-white/20 text-white border-none text-[9px] font-black tracking-tighter px-1.5 h-4">
                                                    AI
                                                </Badge>
                                            )}
                                            {isOwner && (
                                                <Badge className="bg-white/20 text-white border-none text-[9px] font-black tracking-tighter px-1.5 h-4">
                                                    TÚ
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <ChatInput
                value={messageText}
                onChangeText={setMessageText}
                onSend={() => handleSend(messageText, selectedImages)}
                selectedImages={selectedImages}
                onImagesChange={setSelectedImages}
                comercioId={comercioId}
            />
        </div>
    );
}
