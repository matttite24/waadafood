"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, X, Clock, UploadSimple } from "@phosphor-icons/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export function MenuImagesSettings() {
    const { userId } = useAuth();
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const updateComercio = useMutation(api.comercios.update);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const [imagenesMenu, setImagenesMenu] = useState<string[]>([]);
    const [tiemposPreparacion, setTiemposPreparacion] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (comercio) {
            setImagenesMenu(comercio.imagenes_menu || []);
            setTiemposPreparacion(comercio.tiempos_preparacion || "");
        }
    }, [comercio]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Por favor selecciona una imagen válida");
            return;
        }

        setUploadingImage(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();
            setImagenesMenu(prev => [...prev, storageId]);
            toast.success("Imagen subida correctamente");
        } catch (error) {
            toast.error("Error al subir la imagen");
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setImagenesMenu(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!comercio) return;
        setSaving(true);
        try {
            await updateComercio({
                id: comercio._id,
                updates: {
                    imagenes_menu: imagenesMenu,
                    tiempos_preparacion: tiemposPreparacion,
                }
            });
            toast.success("Información guardada correctamente");
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (!comercio) return <div>Cargando...</div>;

    return (
        <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-bold font-display">Carta y Tiempos</h3>
                    <p className="text-sm text-muted-foreground">
                        Sube imágenes de tu menú y configura los tiempos de preparación.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full px-6 bg-[#00754A] hover:bg-[#00754A]/90 font-bold text-xs uppercase tracking-widest shadow-lg h-10"
                >
                    {saving ? "Guardando..." : "Guardar"}
                </Button>
            </div>

            {/* Imágenes del Menú */}
            <div className="space-y-4 p-6 border rounded-2xl bg-background/50">
                <div className="flex items-center gap-2">
                    <ImageIcon size={20} className="text-primary" />
                    <h4 className="font-bold">Imágenes del Menú</h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagenesMenu.map((storageId, index) => (
                        <ImagePreview
                            key={`${storageId}-${index}`}
                            storageId={storageId}
                            onDelete={() => handleRemoveImage(index)}
                        />
                    ))}
                </div>

                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="menu-image-upload"
                    />
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="rounded-full gap-2 h-10 px-6 font-bold border-primary/20 text-primary hover:bg-primary/5"
                    >
                        <UploadSimple size={18} />
                        {uploadingImage ? "Subiendo..." : "Subir Imagen"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        Recomendado: Imágenes en formato 16:9, máximo 5MB.
                    </p>
                </div>
            </div>

            {/* Tiempos de Preparación */}
            <div className="space-y-4 p-6 border rounded-2xl bg-background/50">
                <div className="flex items-center gap-2">
                    <Clock size={20} className="text-primary" />
                    <h4 className="font-bold">Contexto y Tiempos</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                    Explica cuánto suelen demorar los pedidos y qué debe saber el cliente sobre la preparación.
                </p>
                <div className="space-y-2">
                    <Label>Tiempos y Detalles de Preparación</Label>
                    <Textarea
                        value={tiemposPreparacion}
                        onChange={(e) => setTiemposPreparacion(e.target.value)}
                        placeholder="Ej: Las hamburguesas demoran 15-20 min. Los fines de semana puede haber demoras de hasta 40 min..."
                        className="min-h-[120px] resize-none"
                    />
                </div>
            </div>


        </div>
    );
}

// Image Preview Component
function ImagePreview({ storageId, onDelete }: { storageId: string; onDelete: () => void }) {
    const isUrl = storageId.startsWith('http');
    const urlFromConvex = useQuery(api.files.getUrl, isUrl ? "skip" : { storageId });
    const displayUrl = isUrl ? storageId : urlFromConvex;

    if (!displayUrl) {
        return (
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative group aspect-video rounded-xl overflow-hidden border bg-muted">
            <img
                src={displayUrl}
                alt="Menu image"
                className="w-full h-full object-cover"
            />
            <button
                onClick={onDelete}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={14} />
            </button>
        </div>
    );
}
