import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkle, Clock, TrendUp } from "@phosphor-icons/react";

interface AiImpactCardProps {
    iaSalesAttributed: number;
    hoursSaved: number;
    iaEfficiency: number;
    todaySales: number;
}

export function AiImpactCard({ iaSalesAttributed, hoursSaved, iaEfficiency, todaySales }: AiImpactCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Card className="border-transparent overflow-hidden bg-background">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white">
                        <Sparkle size={20} weight="fill" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold font-display">Impacto de tu IA (Hoy)</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 justify-center md:justify-start">
                            <TrendUp size={16} className="text-emerald-500" />
                            Ventas Atribuidas
                        </p>
                        <div className="text-3xl font-black tracking-tight text-foreground font-display">
                            {formatCurrency(iaSalesAttributed)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            De {formatCurrency(todaySales)} totales hoy
                        </p>
                    </div>

                    <div className="space-y-1 relative md:before:content-[''] md:before:absolute md:before:-left-4 md:before:top-2 md:before:bottom-2 md:before:w-px md:before:bg-border/50">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 justify-center md:justify-start">
                            <Clock size={16} className="text-blue-500" />
                            Tiempo Ahorrado
                        </p>
                        <div className="text-3xl font-black tracking-tight text-foreground font-display">
                            {hoursSaved}h
                        </div>
                        <p className="text-xs text-muted-foreground">
                            En gestión de chats manuales
                        </p>
                    </div>

                    <div className="space-y-1 relative md:before:content-[''] md:before:absolute md:before:-left-4 md:before:top-2 md:before:bottom-2 md:before:w-px md:before:bg-border/50">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 justify-center md:justify-start">
                            <Sparkle size={16} className="text-purple-500" />
                            Eficiencia IA
                        </p>
                        <div className="text-3xl font-black tracking-tight text-foreground font-display">
                            {iaEfficiency}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            De tus clientes atendidos sin ti
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
