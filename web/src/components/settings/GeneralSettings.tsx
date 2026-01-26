"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Storefront, Phone, MapPin, MapTrifold } from "@phosphor-icons/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check } from "@phosphor-icons/react";

export function GeneralSettings() {
    const { userId } = useAuth();
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const updateComercio = useMutation(api.comercios.update);

    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [ciudad, setCiudad] = useState("");
    const [googleMapsLink, setGoogleMapsLink] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (comercio) {
            setNombre(comercio.nombre_comercio || "");
            setDescripcion(comercio.descripcion_corta || "");
            setTelefono(comercio.telefono_contacto || "");
            setDireccion(comercio.direccion || "");
            setCiudad(comercio.ciudad || "");
            setGoogleMapsLink(comercio.google_maps_link || "");
        }
    }, [comercio]);

    const handleSave = async () => {
        if (!comercio) return;
        setSaving(true);
        try {
            await updateComercio({
                id: comercio._id,
                updates: {
                    nombre_comercio: nombre,
                    descripcion_corta: descripcion,
                    telefono_contacto: telefono,
                    direccion,
                    ciudad,
                    google_maps_link: googleMapsLink,
                }
            });
            toast.success("Información actualizada");
        } catch (error) {
            toast.error("Error al actualizar");
        } finally {
            setSaving(false);
        }
    };

    if (!comercio) return <div className="p-8">Cargando...</div>;

    return (
        <div className="space-y-8 max-w-2xl animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-black font-display tracking-tight">Información de Negocio</h3>
                    <p className="text-sm text-muted-foreground">Configura los datos básicos de tu comercio</p>
                </div>
                <Button onClick={handleSave} disabled={saving} rounded="full" className="gap-2 shadow-lg px-6 bg-[#00754A] hover:bg-[#00754A]/90">
                    {saving ? (
                        "Guardando..."
                    ) : (
                        <>
                            <Check size={18} weight="bold" />
                            Guardar
                        </>
                    )}
                </Button>
            </div>

            {/* Datos Básicos */}
            <div className="space-y-4 p-6 border rounded-2xl bg-background/50">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                    <Storefront size={18} />
                    Datos Básicos
                </h4>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre del Negocio</Label>
                        <Input
                            id="name"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Mi Pizzería"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono de Contacto</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-muted-foreground" size={18} />
                            <Input
                                id="phone"
                                className="pl-10"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción del Negocio</Label>
                        <Textarea
                            id="description"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Describe tu negocio en pocas palabras..."
                            className="min-h-[80px] resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-4 p-6 border rounded-2xl bg-background/50">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                    <MapPin size={18} />
                    Ubicación
                </h4>

                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                            id="city"
                            value={ciudad}
                            onChange={(e) => setCiudad(e.target.value)}
                            placeholder="Ej: Ciudad de México"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Dirección Completa (Instrucciones de llegada)</Label>
                        <Textarea
                            id="address"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            placeholder="Indica calle, número y referencias para tus clientes..."
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="maps">Link de Google Maps</Label>
                        <div className="relative">
                            <MapTrifold className="absolute left-3 top-3 text-muted-foreground" size={18} />
                            <Input
                                id="maps"
                                className="pl-10"
                                value={googleMapsLink}
                                onChange={(e) => setGoogleMapsLink(e.target.value)}
                                placeholder="https://maps.google.com/..."
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
