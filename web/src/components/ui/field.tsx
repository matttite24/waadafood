import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Campo con etiqueta SIEMPRE visible, ayuda y error. Úsalo para cualquier input del panel:
 *   <Field label="Nombre" hint="Como lo ven tus clientes" error={err}><Input value=… onChange=… /></Field>
 * Enlaza solo la etiqueta (htmlFor), la ayuda y el error (aria-describedby), para lectores de pantalla.
 */
export function Field({
    label, hint, error, optional, className, children,
}: {
    label: string;
    hint?: string;
    error?: string | null;
    optional?: boolean;
    className?: string;
    children: React.ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
}) {
    const id = React.useId();
    const note = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <label htmlFor={id} className="text-sm font-medium">
                {label}
                {optional && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
            </label>
            {React.cloneElement(children, { id, "aria-invalid": !!error || undefined, "aria-describedby": note })}
            {error ? (
                <p id={`${id}-err`} role="alert" className="text-sm text-destructive">{error}</p>
            ) : hint ? (
                <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");
const parse = (t: string) => {
    const n = parseFloat(t.replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

/** Precio en dólares: teclado decimal, acepta coma o punto, selecciona todo al tocar y da formato 0.00 al salir. */
export function PriceInput({
    value, onChange, className, ...rest
}: { value: number; onChange: (n: number) => void; className?: string } & Omit<React.ComponentProps<"input">, "value" | "onChange" | "type">) {
    const [text, setText] = React.useState(fmt(value));
    const focused = React.useRef(false);
    React.useEffect(() => { if (!focused.current) setText(fmt(value)); }, [value]);
    return (
        <div className="relative">
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
                {...rest}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className={cn("pl-7 tabular-nums", className)}
                value={text}
                onFocus={(e) => { focused.current = true; e.currentTarget.select(); }}
                onChange={(e) => { setText(e.target.value); onChange(parse(e.target.value)); }}
                onBlur={() => { focused.current = false; setText(fmt(value)); }}
            />
        </div>
    );
}
