import { Vacio } from "@/components/panel/Vacio";

export default function Pedidos() {
    return (
        <>
            <h1 className="mb-2 text-2xl font-bold">Pedidos</h1>
            <Vacio titulo="Aún no hay pedidos" texto="Cuando alguien pida en tu kiosko, aparecerá aquí al instante." />
        </>
    );
}
