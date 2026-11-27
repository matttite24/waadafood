import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Registro() {
    const create = useMutation(api.stores.getOrCreateMine);
    const [name, setName] = useState("");
    const [waNumber, setWaNumber] = useState("");
    const [category, setCategory] = useState("");
    const [busy, setBusy] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        try {
            await create({ name, waNumber, category: category || undefined });
        } catch (err) {
            toast.error(err instanceof Error ? err.message.replace(/^.*Uncaught Error: /s, "") : "No se pudo crear el comercio");
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Crea tu kiosko</h1>
                <p className="text-sm text-muted-foreground">Tres datos y listo. Luego armas tu menú.</p>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Nombre del local</Label>
                    <Input id="name" required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="wa">WhatsApp (con código de país, sin +)</Label>
                    <Input id="wa" required inputMode="numeric" placeholder="593988200451" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="cat">Categoría (opcional)</Label>
                    <Input id="cat" placeholder="Hamburguesas, pizzas…" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <Button type="submit" size="lg" disabled={busy}>{busy ? "Creando…" : "Crear mi kiosko"}</Button>
            </form>
        </main>
    );
}
