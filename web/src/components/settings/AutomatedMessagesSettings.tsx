"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChatText, Plus, Trash, PencilSimple } from "@phosphor-icons/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

export function AutomatedMessagesSettings() {
    const { userId } = useAuth();
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const plantillas = useQuery(api.plantillas.list, comercio ? { comercio_id: comercio._id } : "skip");

    const createPlantilla = useMutation(api.plantillas.create);
    const updatePlantilla = useMutation(api.plantillas.update);
    const deletePlantilla = useMutation(api.plantillas.remove);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<Id<"plantillas"> | null>(null);
    const [nombre, setNombre] = useState("");
    const [contenido, setContenido] = useState("");
    const [saving, setSaving] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleOpenCreate = () => {
        setEditingId(null);
        setNombre("");
        setContenido("");
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (p: any) => {
        setEditingId(p._id);
        setNombre(p.nombre);
        setContenido(p.contenido);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!comercio || !nombre.trim() || !contenido.trim()) return;
        setSaving(true);
        try {
            if (editingId) {
                await updatePlantilla({ id: editingId, nombre, contenido });
                toast.success("Plantilla actualizada");
            } else {
                await createPlantilla({ comercio_id: comercio._id, nombre, contenido });
                toast.success("Plantilla creada");
            }
            setIsDialogOpen(false);
            setNombre("");
            setContenido("");
        } catch (error: any) {
            toast.error(error.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!templateToDelete) return;
        setIsDeleting(true);
        try {
            await deletePlantilla({ id: templateToDelete._id });
            toast.success("Plantilla eliminada");
            setTemplateToDelete(null);
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!comercio || plantillas === undefined) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold font-display">Respuestas Rápidas</h3>
                    <p className="text-sm text-muted-foreground">
                        Escribe "/" seguido del nombre para usar estas plantillas en el chat.
                    </p>
                </div>
                <Button
                    onClick={handleOpenCreate}
                    className="rounded-full gap-2 shadow-lg bg-[#00754A] hover:bg-[#00754A]/90 h-10 px-6 font-bold text-xs uppercase tracking-widest"
                >
                    <Plus weight="bold" />
                    Nueva
                </Button>
            </div>

            {plantillas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-2xl bg-muted/10">
                    <ChatText size={48} className="text-muted-foreground mb-4" />
                    <h4 className="font-bold text-lg mb-2">No tienes respuestas rápidas</h4>
                    <p className="text-muted-foreground text-sm max-w-md">
                        Crea una plantilla para usarla escribiendo "/" seguido del nombre en el chat.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">

                    <div className="grid gap-3">
                        {plantillas.map((p) => (
                            <div
                                key={p._id}
                                className="p-4 border rounded-xl bg-background hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-primary font-bold text-lg">/{p.nombre}</span>
                                        </div>
                                        <p className="text-muted-foreground text-sm line-clamp-2">
                                            {p.contenido}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenEdit(p)}
                                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <PencilSimple size={18} />
                                        </button>
                                        <button
                                            onClick={() => setTemplateToDelete(p)}
                                            className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Editar Respuesta Rápida" : "Nueva Respuesta Rápida"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Nombre (Atajo)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">/</span>
                                <Input
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value.replace(/\s+/g, '').toLowerCase())}
                                    placeholder="saludo, precio, despedida..."
                                    className="pl-7"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Este es el comando que escribirás. Ej: /saludo
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Contenido del mensaje</Label>
                            <Textarea
                                value={contenido}
                                onChange={(e) => setContenido(e.target.value)}
                                placeholder="Escribe el mensaje completo que se enviará..."
                                className="min-h-[150px] resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full px-6 h-10 font-bold">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !nombre.trim() || !contenido.trim()}
                            className="rounded-full px-8 font-bold shadow-lg bg-[#00754A] hover:bg-[#00754A]/90 h-10 text-xs uppercase tracking-widest"
                        >
                            {saving ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmationDialog
                open={templateToDelete !== null}
                onOpenChange={(open) => !open && setTemplateToDelete(null)}
                onConfirm={handleDelete}
                title="¿Eliminar respuesta rápida?"
                description={`¿Estás seguro de que deseas eliminar la respuesta "/${templateToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="destructive"
                loading={isDeleting}
            />
        </div>
    );
}
