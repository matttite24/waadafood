export function Vacio({ titulo, texto }: { titulo: string; texto: string }) {
    return (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <p className="max-w-xs text-sm text-muted-foreground">{texto}</p>
        </div>
    );
}
