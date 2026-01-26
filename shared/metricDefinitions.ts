export interface MetricDetail {
    id: string;
    description: string;
    color: string;
    bgColor: string; // Para Web (bg-emerald-500/10)
    borderColor: string; // Para Web (border-emerald-500/20)
    formula: string;
    iconName: string; // Nombre base del icono (TrendUp, Money, etc)
}

export const METRIC_DETAILS: Record<string, MetricDetail> = {
    "Total de Ventas": {
        id: "revenue",
        description: "El total de ingresos brutos generados por tu negocio. Se calcula sumando el total de todos los pedidos confirmados (excluyendo borradores y cancelados).",
        color: "#10B981", // emerald-600
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        formula: "Suma de pedidos confirmados",
        iconName: "TrendUp"
    },
    "Ticket Promedio": {
        id: "average_ticket",
        description: "Representa el valor promedio de cada venta. Es un indicador clave para entender el poder adquisitivo de tus clientes y la efectividad de tus estrategias de up-selling.",
        color: "#1E3932", // Starbucks green
        bgColor: "bg-green-800/10",
        borderColor: "border-green-800/20",
        formula: "Ingresos Totales / Número de Pedidos",
        iconName: "Money"
    },
    "Pedidos Creados": {
        id: "orders_count",
        description: "El volumen total de ventas procesadas. Cada número representa una transacción exitosa que se ha gestionado a través de la plataforma.",
        color: "#F59E0B", // amber-500
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20",
        formula: "Cantidad de órdenes no canceladas",
        iconName: "ShoppingBag"
    },
    "Nuevos Clientes": {
        id: "new_clients",
        description: "Personas nuevas que han interactuado con tu negocio por primera vez en este periodo. Es un indicador clave del crecimiento de tu alcance.",
        color: "#10B981", // emerald-500
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        formula: "Clientes creados en el periodo",
        iconName: "Users"
    },
    "Conversión": {
        id: "conversion",
        description: "Indica qué tan efectivo es tu flujo de ventas. Mide cuántas conversaciones se transforman finalmente en una venta real.",
        color: "#3B82F6", // blue-500
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        formula: "(Pedidos / Chats totales) * 100",
        iconName: "Percent"
    },
    "Eficiencia iA": {
        id: "ia_efficiency",
        description: "Muestra la cantidad de trabajo que la IA está haciendo por ti. Un porcentaje alto significa que la mayoría de tus clientes están siendo atendidos automáticamente.",
        color: "#8B5CF6", // violet-500
        bgColor: "bg-violet-500/10",
        borderColor: "border-violet-500/20",
        formula: "(Mensajes IA / Mensajes totales) * 100",
        iconName: "Sparkle"
    }
};
