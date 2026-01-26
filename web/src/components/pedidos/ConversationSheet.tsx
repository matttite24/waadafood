"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ConversationPanel } from "@/components/chat/ConversationPanel";
import { ContactPanel } from "@/components/chat/ContactPanel";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConversationSheetProps {
    clienteId: Id<"clientes"> | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ConversationSheet({ clienteId, open, onOpenChange }: ConversationSheetProps) {
    const [showInfoPanel, setShowInfoPanel] = useState(false);

    // 1. Get client details
    const clienteData = useQuery(api.clientes.getClienteDetail,
        clienteId ? { cliente_id: clienteId } : "skip"
    );

    // 2. Get messages
    const messages = useQuery(api.mensajes.list,
        clienteId ? { cliente_id: clienteId } : "skip"
    );

    // 3. Get tags
    const allTags = useQuery(api.etiquetas.listByComercio,
        clienteData?.cliente.comercio_id ? { comercio_id: clienteData.cliente.comercio_id } : "skip"
    );

    // Mutations
    const sendMessageMutation = useMutation(api.mensajes.send);
    const updateClientMutation = useMutation(api.clientes.update);

    const handleSendMessage = async (text: string, imageIds?: string[]) => {
        if (!clienteData || !clienteId) return;

        try {
            await sendMessageMutation({
                comercio_id: clienteData.cliente.comercio_id,
                cliente_id: clienteId,
                contenido: text,
                es_ia: false,
                es_dueno: true,
                imagenes: imageIds && imageIds.length > 0 ? imageIds : undefined,
            });

            await handleUpdateClient(clienteId, { requiere_atencion_humana: false });
        } catch (error) {
            console.error("Error al enviar mensaje:", error);
        }
    };

    const handleUpdateClient = async (id: Id<"clientes">, updates: any) => {
        try {
            await updateClientMutation({ id, updates });
        } catch (error) {
            console.error("Error al actualizar cliente:", error);
        }
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            const now = new Date();

            if (date.toDateString() === now.toDateString()) {
                return format(date, "HH:mm", { locale: es });
            }
            return format(date, "d MMM, HH:mm", { locale: es });
        } catch (e) {
            return "";
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className={cn(
                    "p-4 bg-transparent border-none shadow-none transition-all duration-300 ease-in-out sm:max-w-none flex justify-end",
                    showInfoPanel ? "w-full lg:max-w-6xl" : "w-full sm:max-w-3xl"
                )}
            >
                <div className="flex h-full gap-4 w-full max-w-full">
                    <div className="flex-1 flex flex-col min-w-0 h-full bg-background rounded-3xl border border-border/50 shadow-2xl overflow-hidden relative">
                        <ConversationPanel
                            selectedContact={clienteData?.cliente}
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            onToggleInfoPanel={() => setShowInfoPanel(!showInfoPanel)}
                            showInfoPanel={showInfoPanel}
                            onUpdateClient={handleUpdateClient}
                            formatTime={formatTime}
                            availableTags={allTags}
                            comercioId={clienteData?.cliente.comercio_id}
                        />
                    </div>

                    {showInfoPanel && clienteData && (
                        <div className="w-80 border border-border/50 flex flex-col h-full bg-background rounded-3xl shadow-2xl animate-in slide-in-from-right-4 duration-300 flex-shrink-0 overflow-hidden">
                            <ContactPanel
                                selectedContact={clienteData.cliente}
                                clientDetail={clienteData}
                                onClose={() => setShowInfoPanel(false)}
                                formatTime={formatTime}
                            />
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
