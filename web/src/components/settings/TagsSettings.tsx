import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tag, Trash, Plus, PencilSimple } from "@phosphor-icons/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

const COLORS = [
    '#00754A', '#EF4444', '#F59E0B', '#3B82F6',
    '#8B5CF6', '#EC4899', '#64748B', '#1E3932'
];

export function TagsSettings() {
    const { userId } = useAuth();
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const etiquetas = useQuery(api.etiquetas.listByComercio, comercio ? { comercio_id: comercio._id } : "skip");

    const createEtiqueta = useMutation(api.etiquetas.create);
    const updateEtiqueta = useMutation(api.etiquetas.update);
    const removeEtiqueta = useMutation(api.etiquetas.remove);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<{ id?: Id<"etiquetas">, nombre: string, color: string } | null>(null);
    const [tagToDelete, setTagToDelete] = useState<Id<"etiquetas"> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = (tag?: any) => {
        if (tag) {
            setEditingTag({ id: tag._id, nombre: tag.nombre, color: tag.color });
        } else {
            setEditingTag({ nombre: "", color: COLORS[0] });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!comercio || !editingTag || !editingTag.nombre.trim()) return;

        try {
            if (editingTag.id) {
                await updateEtiqueta({ id: editingTag.id, nombre: editingTag.nombre, color: editingTag.color });
                toast.success("Etiqueta actualizada");
            } else {
                await createEtiqueta({ comercio_id: comercio._id, nombre: editingTag.nombre, color: editingTag.color });
                toast.success("Etiqueta creada");
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error("Error al guardar");
        }
    };

    const handleDelete = async () => {
        if (!tagToDelete) return;
        setIsDeleting(true);
        try {
            await removeEtiqueta({ id: tagToDelete });
            toast.success("Etiqueta eliminada");
            setTagToDelete(null);
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!etiquetas) return <div>Cargando...</div>;

    return (
        <div className="space-y-8 max-w-3xl animate-in fade-in duration-500 pb-10">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-black font-display tracking-tight">Etiquetas de Chats</h3>
                    <p className="text-sm text-muted-foreground">Organiza y segmenta tus conversaciones con facilidad.</p>
                </div>
                <Button onClick={() => handleEdit()} rounded="full" className="gap-2 shadow-lg px-6 bg-[#00754A] hover:bg-[#00754A]/90 h-10 font-bold text-xs uppercase tracking-widest">
                    <Plus size={18} weight="bold" />
                    Nueva Etiqueta
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {etiquetas.map((tag) => (
                    <div
                        key={tag._id}
                        className="group flex items-center justify-between p-4 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="h-4 w-4 rounded-full shadow-inner"
                                style={{ backgroundColor: tag.color }}
                            />
                            <span className="font-bold text-sm text-foreground">{tag.nombre}</span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(tag)}
                                className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                            >
                                <PencilSimple size={14} weight="bold" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTagToDelete(tag._id)}
                                className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <Trash size={14} weight="bold" />
                            </Button>
                        </div>
                    </div>
                ))}

                {etiquetas.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-20 bg-muted/5">
                        <Tag size={48} weight="thin" />
                        <p className="mt-4 font-display font-medium">No hay etiquetas creadas aún</p>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader className="pt-4 px-2">
                        <DialogTitle className="text-2xl font-black font-display tracking-tight">
                            {editingTag?.id ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4 px-2">
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre de la Etiqueta</Label>
                            <Input
                                value={editingTag?.nombre || ""}
                                onChange={(e) => setEditingTag(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                                placeholder="Ej: VIP, Cliente Fiel, Urgente..."
                                className="h-12 rounded-xl px-4 border-2 focus:border-primary transition-all text-base shadow-sm bg-muted/5"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Color Distintivo</Label>
                            <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl bg-muted/10 border border-border/40">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setEditingTag(prev => prev ? { ...prev, color } : null)}
                                        className={cn(
                                            "w-9 h-9 rounded-xl transition-all shadow-sm flex items-center justify-center",
                                            editingTag?.color === color
                                                ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-lg"
                                                : "hover:scale-110 grayscale-[0.3] hover:grayscale-0"
                                        )}
                                        style={{ backgroundColor: color }}
                                    >
                                        {editingTag?.color === color && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                            rounded="full"
                            className="px-6 font-bold h-10"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!editingTag?.nombre.trim()}
                            rounded="full"
                            className="px-8 font-bold shadow-lg bg-[#00754A] hover:bg-[#00754A]/90 h-10 text-xs uppercase tracking-widest"
                        >
                            {editingTag?.id ? 'Guardar' : 'Crear'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmationDialog
                open={tagToDelete !== null}
                onOpenChange={(open) => !open && setTagToDelete(null)}
                onConfirm={handleDelete}
                title="¿Eliminar etiqueta?"
                description="Esta acción eliminará la etiqueta permanentemente de todos los chats asignados. No se puede deshacer."
                confirmText="Eliminar"
                variant="destructive"
                loading={isDeleting}
            />
        </div>
    );
}
