import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, ForkKnife, FloppyDisk, Trash, Camera, Check, PlusCircle, Plus } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

const CATEGORIAS_LISTA = ['Combos', 'Entradas', 'Principales', 'Bebidas', 'Postres', 'Otros'] as const;

interface Product {
    _id: Id<"productos">;
    nombre: string;
    precio: number;
    categoria?: string;
    descripcion?: string;
    imagen_url?: string;
    disponible?: boolean;
}

interface ProductEditPanelProps {
    product: Product | null | undefined;
    comercioId: Id<"comercios">;
    onClose: () => void;
    onOpenNew: () => void;
}

export function ProductEditPanel({ product, comercioId, onClose, onOpenNew }: ProductEditPanelProps) {
    const isEditing = !!product && typeof product === 'object' && '_id' in product;
    const isCreating = product === null;
    const isPlaceholder = product === undefined;

    const createProduct = useMutation(api.productos.create);
    const updateProduct = useMutation(api.productos.update);
    const removeProduct = useMutation(api.productos.remove);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        precio: "",
        categoria: "Otros",
        imagen_url: "",
        disponible: true
    });

    useEffect(() => {
        if (product && typeof product === 'object') {
            setFormData({
                nombre: product.nombre || "",
                descripcion: product.descripcion || "",
                precio: product.precio?.toString() || "",
                categoria: product.categoria || "Otros",
                imagen_url: product.imagen_url || "",
                disponible: product.disponible !== false
            });
        } else if (product === null) {
            setFormData({
                nombre: "",
                descripcion: "",
                precio: "",
                categoria: "Otros",
                imagen_url: "",
                disponible: true
            });
        }
    }, [product]);

    // Media helpers
    const isFullUrl = formData.imagen_url.startsWith("http") || formData.imagen_url.startsWith("data:");
    const storageUrl = useQuery(api.files.getUrl, !formData.imagen_url || isFullUrl ? "skip" : { storageId: formData.imagen_url as Id<"_storage"> });
    const previewUrl = isFullUrl ? formData.imagen_url : storageUrl;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            const { storageId } = await result.json();
            setFormData(prev => ({ ...prev, imagen_url: storageId }));
            toast.success("Imagen cargada");
        } catch (error) {
            console.error(error);
            toast.error("Error al subir imagen");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!formData.nombre || !formData.precio) {
            toast.error("Nombre y precio son obligatorios");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
                precio: parseFloat(formData.precio),
                categoria: formData.categoria,
                imagen_url: formData.imagen_url || undefined,
                disponible: formData.disponible
            };

            if (isEditing && product) {
                await updateProduct({ id: product._id, ...payload });
                toast.success("Producto actualizado");
            } else {
                await createProduct({ comercio_id: comercioId, ...payload });
                toast.success("Producto creado");
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await removeProduct({ id: product!._id });
            toast.success("Producto eliminado");
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar");
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    if (isPlaceholder) {
        return (
            <div className="w-[440px] h-full flex-shrink-0 bg-background rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center p-12 text-center">
                <div className="p-8 rounded-full bg-primary/5 mb-8">
                    <PlusCircle size={64} weight="thin" className="text-primary/40" />
                </div>
                <h3 className="font-display font-bold text-2xl text-foreground">Gestión de Menú</h3>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">Selecciona un producto o crea uno nuevo.</p>
                <Button
                    className="mt-10 rounded-full px-8 h-12 bg-primary hover:bg-primary/90 font-bold text-xs uppercase tracking-widest shadow-lg flex items-center gap-2"
                    onClick={onOpenNew}
                >
                    <Plus size={18} weight="bold" />
                    Nuevo Producto
                </Button>
            </div>
        );
    }

    return (
        <div className="w-[440px] h-full flex-shrink-0 bg-background rounded-2xl border border-border/50 shadow-sm flex flex-col overflow-hidden">
            {/* Header Title */}
            <div className="p-6 text-center relative border-b border-border/5">
                <h2 className="font-display font-bold text-lg text-foreground">
                    {isCreating ? "Nuevo Producto" : "Editar Producto"}
                </h2>
                <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-8 w-8" onClick={onClose}>
                    <X size={16} weight="bold" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    {/* Image Section */}
                    <div className="relative group aspect-[4/3] w-full rounded-2xl overflow-hidden bg-muted border border-border/50 shadow-sm">
                        {previewUrl ? (
                            <img src={previewUrl} alt={formData.nombre} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground/30">
                                <ForkKnife size={64} weight="thin" />
                                <p className="text-xs font-black uppercase tracking-widest mt-2">Agregar Foto</p>
                            </div>
                        )}

                        {uploadingImage && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                                <div className="h-8 w-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            </div>
                        )}

                        <div className="absolute bottom-3 right-3 flex gap-2">
                            {formData.imagen_url && (
                                <Button type="button" variant="destructive" size="icon" className="h-9 w-9 rounded-xl shadow-lg" onClick={() => setFormData(p => ({ ...p, imagen_url: "" }))}>
                                    <X size={18} weight="bold" />
                                </Button>
                            )}
                            <Button type="button" className="h-9 px-4 gap-2 rounded-xl bg-black/70 hover:bg-black/80 backdrop-blur-md text-white border-none shadow-lg text-xs font-bold" onClick={() => fileInputRef.current?.click()}>
                                <Camera size={18} weight="bold" />
                                CAMBIAR
                            </Button>
                        </div>
                    </div>

                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                    {/* Visible Toggle Card */}
                    <div className={cn(
                        "p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-sm",
                        formData.disponible ? "bg-primary/5 border-primary/10" : "bg-muted/30 border-border/50"
                    )}>
                        <div className="space-y-0.5">
                            <h4 className={cn("text-base font-bold", formData.disponible ? "text-primary" : "text-muted-foreground")}>
                                {formData.disponible ? "Visible en el Menú" : "Oculto del Menú"}
                            </h4>
                            <p className="text-xs text-muted-foreground font-medium italic">Disponible para el asistente</p>
                        </div>
                        <Switch checked={formData.disponible} onCheckedChange={(checked) => setFormData(p => ({ ...p, disponible: checked }))} />
                    </div>

                    {/* Form Section */}
                    <div className="space-y-6">
                        {/* Categoría Chips */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-primary ml-1">CATEGORÍA</Label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIAS_LISTA.map(cat => {
                                    const isSelected = formData.categoria === cat;
                                    return (
                                        <Badge
                                            key={cat}
                                            variant={isSelected ? "default" : "outline"}
                                            className={cn(
                                                "px-4 py-2 rounded-xl cursor-pointer text-xs font-bold transition-all duration-200 border-border/50",
                                                isSelected ? "bg-[#D4E9E2] text-[#00754A] border-none hover:bg-[#D4E9E2]" : "text-muted-foreground hover:bg-muted"
                                            )}
                                            onClick={() => setFormData(p => ({ ...p, categoria: cat }))}
                                        >
                                            {isSelected && <Check size={14} weight="bold" className="mr-2" />}
                                            {cat}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-2 relative">
                            <Label htmlFor="nombre" className="text-xs font-bold text-muted-foreground/60 absolute -top-2 left-4 bg-background px-2 z-10">Nombre</Label>
                            <Input
                                id="nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
                                placeholder="Ej: Hamburguesa"
                                className="rounded-xl border-border/50 bg-transparent h-14 font-medium px-5 focus-visible:ring-primary/20"
                            />
                        </div>

                        {/* Description Input */}
                        <div className="space-y-2 relative">
                            <Label htmlFor="descripcion" className="text-xs font-bold text-muted-foreground/60 absolute -top-2 left-4 bg-background px-2 z-10">Descripción</Label>
                            <Textarea
                                id="descripcion"
                                value={formData.descripcion}
                                onChange={(e) => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                                placeholder="Escribe aquí..."
                                className="rounded-xl border-border/50 bg-transparent min-h-[120px] font-medium p-5 focus-visible:ring-primary/20 resize-none leading-relaxed"
                            />
                        </div>

                        {/* Price Input */}
                        <div className="space-y-2 relative">
                            <Label htmlFor="precio" className="text-xs font-bold text-muted-foreground/60 absolute -top-2 left-4 bg-background px-2 z-10">Precio</Label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">$</span>
                                <Input
                                    id="precio"
                                    type="number"
                                    step="0.01"
                                    value={formData.precio}
                                    onChange={(e) => setFormData(p => ({ ...p, precio: e.target.value }))}
                                    className="rounded-xl border-border/50 bg-transparent h-14 pl-10 font-bold text-lg focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-6 border-t bg-background flex gap-3">
                {isEditing && (
                    <Button variant="ghost" className="flex-1 rounded-full h-12 text-red-500 font-bold uppercase tracking-widest text-xs" onClick={() => setShowDeleteConfirm(true)} disabled={loading}>
                        <Trash size={18} className="mr-2" />
                        Eliminar
                    </Button>
                )}
                <Button className="flex-[2] rounded-full h-12 bg-primary hover:bg-primary/90 font-bold text-xs uppercase tracking-widest shadow-lg" onClick={handleSave} disabled={loading || uploadingImage}>
                    {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                        <div className="flex items-center gap-2">
                            <FloppyDisk size={20} weight="bold" />
                            <span>{isEditing ? "Guardar" : "Añadir"}</span>
                        </div>
                    )}
                </Button>
            </div>

            <ConfirmationDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={handleDelete}
                title="¿Eliminar producto?"
                description={`Esta acción eliminará "${formData.nombre}" permanentemente del menú. No se puede deshacer.`}
                confirmText="Eliminar"
                variant="destructive"
                loading={loading}
            />
        </div>
    );
}
