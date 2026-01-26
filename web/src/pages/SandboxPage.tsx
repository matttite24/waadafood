import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
    ChatCircleDots,
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

export default function SandboxPage() {
    const { comercioId } = useParams<{ comercioId: string }>();
    const id = comercioId as Id<"comercios">;

    const [step, setStep] = useState<'setup' | 'chat'>('setup');
    const [telefono, setTelefono] = useState("");
    const [nombre, setNombre] = useState("");
    const [messageText, setMessageText] = useState("");
    const [clienteId, setClienteId] = useState<Id<"clientes"> | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const comercio = useQuery(api.comercios.get, id ? { id } : "skip");
    const existingClient = useQuery(api.clientes.getByTelefono,
        (comercio && telefono.length > 5) ? { telefono, commerceId: comercio._id } : "skip"
    );

    const createClient = useMutation(api.clientes.create);
    const sendMessage = useMutation(api.mensajes.send);
    const messages = useQuery(api.mensajes.list, clienteId ? { cliente_id: clienteId } : "skip");

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <div className="text-center space-y-4">
                    <WarningCircle size={48} className="mx-auto text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-medium">Cargando entorno de pruebas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 md:p-8 font-sans">
            <div className="w-full max-w-2xl bg-background rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden flex flex-col h-[85vh] transition-all">
                {/* Header */}
                <div className="h-20 border-b border-border/10 bg-background/80 backdrop-blur-xl px-8 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        {step === 'chat' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-10 w-10 hover:bg-muted"
                                onClick={() => setStep('setup')}
                            >
                                <ArrowLeft size={20} weight="bold" />
                            </Button>
                        )}
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <ChatCircleDots size={24} weight="bold" />
                        </div>
                        <div>
                            <h2 className="font-display font-bold text-lg leading-tight">{comercio.nombre_comercio}</h2>
                            <p className="text-[11px] font-bold text-primary uppercase tracking-widest opacity-70">Sandbox de Pruebas</p>
                        </div>
                    </div>
                </div>

                {step === 'setup' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="space-y-3">
                            <h1 className="text-3xl font-display font-bold tracking-tight">Prueba el Agente iA</h1>
                            <p className="text-muted-foreground text-sm uppercase tracking-wider font-bold opacity-60">Simulador de conversación real</p>
                        </div>

                        <form onSubmit={handleStart} className="w-full space-y-4 pt-4">
                            <div className="space-y-4">
                                <div className="space-y-2 text-left">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Tu Teléfono</label>
                                    <Input
                                        placeholder="Ej: +51 987 654 321"
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        className="h-14 rounded-2xl px-5 border-2 focus:border-primary transition-all text-lg shadow-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Tu Nombre (Opcional)</label>
                                    <Input
                                        placeholder="Ej: Invitado Especial"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="h-14 rounded-2xl px-5 border-2 focus:border-primary transition-all text-lg shadow-sm"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]">
                                Iniciar Simulación
                            </Button>
                        </form>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 bg-muted/5" ref={scrollRef}>
                            <div className="p-8 flex flex-col gap-6">
                                {messages?.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center space-y-4">
                                        <Sparkle size={64} weight="thin" />
                                        <p className="text-lg font-display font-medium">Envía un mensaje para despertar a la iA</p>
                                    </div>
                                )}
                                {messages?.map((msg) => {
                                    const isMe = !msg.es_ia && !msg.es_dueno;
                                    return (
                                        <div key={msg._id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                            <div className={cn(
                                                "max-w-[80%] rounded-3xl p-5 text-sm shadow-sm transition-all animate-in slide-in-from-bottom-2 duration-300",
                                                isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-white border border-border/50 rounded-tl-sm text-foreground"
                                            )}>
                                                <p className="leading-relaxed whitespace-pre-wrap">{msg.contenido}</p>
                                                <div className={cn(
                                                    "flex items-center gap-1.5 mt-2 opacity-50 text-[10px] font-bold uppercase",
                                                    isMe ? "justify-end" : "justify-start"
                                                )}>
                                                    <span>{isMe ? "Tú" : (msg.es_ia ? "Agente iA" : "Tienda")}</span>
                                                    {!isMe && msg.es_ia && <Badge className="bg-primary/10 text-primary border-none text-[8px] h-3.5 px-1 font-black">AI</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        <div className="p-6 bg-background border-t border-border/10">
                            <form onSubmit={handleSend} className="flex gap-3">
                                <Input
                                    className="h-14 rounded-2xl px-6 border-2 focus:border-primary transition-all bg-muted/30"
                                    placeholder="Escribe un mensaje..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                />
                                <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl shrink-0 shadow-lg shadow-primary/10">
                                    <PaperPlaneRight size={24} weight="bold" />
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
