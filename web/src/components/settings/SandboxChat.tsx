"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
    PaperPlaneRight,
    Sparkle,
    ArrowLeft,
    WarningCircle
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SandboxChatProps {
    comercioId: Id<"comercios">;
}

export function SandboxChat({ comercioId }: SandboxChatProps) {
    const [step, setStep] = useState<'setup' | 'chat'>('setup');
    const [telefono, setTelefono] = useState("");
    const [nombre, setNombre] = useState("");
    const [messageText, setMessageText] = useState("");
    const [clienteId, setClienteId] = useState<Id<"clientes"> | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const comercio = useQuery(api.comercios.get, { id: comercioId });
    const existingClient = useQuery(api.clientes.getByTelefono,
        (comercio && telefono.length > 5) ? { telefono, commerceId: comercio._id } : "skip"
    );

    const createClient = useMutation(api.clientes.create);
    const sendMessage = useMutation(api.mensajes.send);
    const messages = useQuery(api.mensajes.list, clienteId ? { cliente_id: clienteId } : "skip");

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comercio || !telefono) return;

        try {
            if (existingClient) {
                setClienteId(existingClient._id);
                setStep('chat');
            } else {
                const newId = await createClient({
                    comercio_id: comercio._id,
                    telefono,
                    nombre_usuario: nombre || 'Invitado'
                });
                setClienteId(newId);
                setStep('chat');
            }
        } catch (error) {
            console.error("Error starting chat:", error);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !clienteId || !comercio) return;

        try {
            await sendMessage({
                comercio_id: comercio._id,
                cliente_id: clienteId,
                contenido: messageText,
                es_ia: false,
                es_dueno: false,
                imagenes: []
            });
            setMessageText("");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!comercio) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <WarningCircle size={48} className="mx-auto text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background border-l">
            {step === 'setup' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="space-y-3">
                        <div className="h-16 w-16 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mb-4">
                            <Sparkle size={32} weight="fill" />
                        </div>
                        <h1 className="text-2xl font-display font-bold tracking-tight">Probar el Asistente</h1>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold opacity-60">Entorno de Simulación</p>
                    </div>

                    <form onSubmit={handleStart} className="w-full max-w-sm space-y-4 pt-4">
                        <div className="space-y-4">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tu Teléfono</label>
                                <Input
                                    placeholder="Ej: +51 987 654 321"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    className="h-12 rounded-xl px-4 border focus:border-primary transition-all shadow-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tu Nombre</label>
                                <Input
                                    placeholder="Ej: Invitado"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="h-12 rounded-xl px-4 border focus:border-primary transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 font-bold shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] gap-2 bg-[#00754A] hover:bg-[#00754A]/90 rounded-full">
                            Entrar a Simulación
                        </Button>
                    </form>
                </div>
            ) : (
                <>
                    <div className="h-16 border-b px-6 flex items-center justify-between bg-muted/5">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-8 w-8"
                                onClick={() => setStep('setup')}
                            >
                                <ArrowLeft size={16} weight="bold" />
                            </Button>
                            <div>
                                <h2 className="font-bold text-sm leading-tight">Probando: {comercio.nombre_comercio}</h2>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-70">En vivo</p>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1" ref={scrollRef}>
                        <div className="p-6 flex flex-col gap-4">
                            {messages?.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 opacity-20 text-center space-y-2">
                                    <Sparkle size={48} weight="thin" />
                                    <p className="text-sm font-display font-medium">Envía un mensaje para comenzar</p>
                                </div>
                            )}
                            {messages?.map((msg) => {
                                const isMe = !msg.es_ia && !msg.es_dueno;
                                return (
                                    <div key={msg._id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "max-w-[85%] rounded-2xl p-4 text-sm shadow-sm transition-all animate-in slide-in-from-bottom-2 duration-300",
                                            isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/50 border border-border/50 rounded-tl-sm text-foreground"
                                        )}>
                                            {msg.imagenes && msg.imagenes.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {msg.imagenes.map((url, i) => (
                                                        <img
                                                            key={i}
                                                            src={url}
                                                            alt="Adjunto"
                                                            className="rounded-lg max-h-48 w-full object-cover border border-border/50"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.contenido}</p>
                                            <div className={cn(
                                                "flex items-center gap-1.5 mt-1.5 opacity-50 text-[9px] font-bold uppercase",
                                                isMe ? "justify-end" : "justify-start"
                                            )}>
                                                <span>{isMe ? "Tú" : (msg.es_ia ? "iA" : "Tienda")}</span>
                                                {!isMe && msg.es_ia && <Badge className="bg-primary/20 text-primary border-none text-[7px] h-3 px-1 font-black">AI</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>

                    <div className="p-4 bg-background border-t">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <Input
                                className="h-12 rounded-xl px-4 border-2 focus:border-primary transition-all bg-muted/10 text-sm"
                                placeholder="Escribe al asistente..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                            />
                            <Button type="submit" size="icon" className="h-12 w-12 shrink-0 shadow-lg shadow-primary/10 bg-[#00754A] hover:bg-[#00754A]/90 rounded-full">
                                <PaperPlaneRight size={20} weight="bold" />
                            </Button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
