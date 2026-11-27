import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { errorText } from "@/components/panel/PublishBar";
import { formatWhatsApp, normalizeWhatsApp } from "../../../shared/phone";

const CATEGORIES = ["Hamburguesas", "Pizzas", "Pollo", "Comida típica", "Mariscos", "Parrilla", "Postres", "Café", "Bebidas", "Desayunos"];

export default function Registro() {
    const create = useMutation(api.stores.getOrCreateMine);
    const [name, setName] = useState("");
    const [wa, setWa] = useState("");
    const [category, setCategory] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const normalized = normalizeWhatsApp(wa);
    const waError = wa.length > 4 && !normalized ? "Revisa el número. Ejemplo: 0988200451" : null;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!normalized) { setError("Escribe tu número de WhatsApp. Ejemplo: 0988200451"); return; }
        setBusy(true);
        setError(null);
        try {
            await create({ name, waNumber: normalized, category: category || undefined });
        } catch (err) {
            setError(errorText(err, "No se pudo crear tu local. Intenta de nuevo."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Crea tu página de pedidos</h1>
                <p className="mt-1 text-base text-muted-foreground">Dos datos y listo. Luego armas tu menú.</p>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
                <Field label="Nombre de tu local">
                    <Input required minLength={2} maxLength={60} autoFocus autoComplete="organization" autoCapitalize="words" enterKeyHint="next" placeholder="Ej.: Brasa y Pan" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="WhatsApp donde recibirás los pedidos" error={waError}
                    hint={normalized ? `Se guardará como ${formatWhatsApp(normalized)}` : "Con tu número de siempre, como lo marcas. Ej.: 0988200451"}>
                    <Input required type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" placeholder="0988200451" value={wa} onChange={(e) => setWa(e.target.value)} />
                </Field>
                <Field label="¿Qué vendes?" optional>
                    <Input list="categorias-registro" maxLength={40} autoComplete="off" autoCapitalize="sentences" enterKeyHint="done" placeholder="Ej.: Hamburguesas" value={category} onChange={(e) => setCategory(e.target.value)} />
                </Field>
                <datalist id="categorias-registro">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>

                {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
                <Button type="submit" size="lg" disabled={busy || name.trim().length < 2}>{busy ? "Creando…" : "Crear mi página"}</Button>
            </form>
        </main>
    );
}
