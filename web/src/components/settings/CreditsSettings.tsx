import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightning, Warning, CheckCircle, PlusCircle, Crown } from "@phosphor-icons/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CreditsSettings() {
    const { userId } = useAuth();
    const comercio = useQuery(api.comercios.getByUserId, userId ? { userId } : "skip");
    const otorgarCreditos = useMutation(api.comercios.otorgarCreditos);

    if (!comercio) return <div>Cargando...</div>;

    const creditos = comercio.creditos || 0;
    const maxCreditos = 100;
    const percentage = Math.min((creditos / maxCreditos) * 100, 100);

    const handleRecharge = async () => {
        try {
            await otorgarCreditos({ id: comercio._id, cantidad: 50 });
            toast.success("¡Paquete recargado exitosamente!");
        } catch (error) {
            toast.error("Error al recargar");
        }
    };

    return (
        <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
            <div>
                <h3 className="text-lg font-bold font-display">Créditos de IA</h3>
                <p className="text-sm text-muted-foreground">Gestiona el consumo de tu asistente inteligente.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Lightning size={120} weight="fill" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white/80 font-medium text-sm uppercase tracking-wider">
                            <Lightning size={18} weight="fill" /> Balance Actual
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        <div>
                            <span className="text-6xl font-black tracking-tighter">{creditos}</span>
                            <span className="text-xl opacity-60 ml-2 font-display">mensajes</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider opacity-80">
                                <span>Uso del Plan</span>
                                <span>{Math.round(percentage)}%</span>
                            </div>
                            <Progress value={percentage} className="bg-white/20 h-2" indicatorClassName="bg-yellow-400" />
                        </div>

                        {creditos < 10 && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                                <Warning size={20} className="text-red-200" />
                                <p className="text-xs font-bold text-red-100">
                                    {creditos === 0 ? "IA Inactiva: Recarga necesaria" : "Créditos bajos"}
                                </p>
                            </div>
                        )}

                        <Button
                            rounded="full"
                            className="w-full bg-white text-indigo-900 hover:bg-white/90 font-bold border-0 h-10"
                            onClick={handleRecharge}
                        >
                            Recargar Saldo (Simulado)
                        </Button>
                    </CardContent>
                </Card>

                {/* Tasks / Gamification */}
                <div className="space-y-4">
                    <h4 className="font-bold font-display text-gray-700">Gana Créditos Gratis</h4>

                    <div className="space-y-3">
                        <TaskItem
                            title="Configura tu menú"
                            reward={20}
                            completed={!!comercio.imagenes_menu?.length}
                            icon={PlusCircle}
                        />
                        <TaskItem
                            title="Vincular métodos de pago"
                            reward={15}
                            completed={!!(comercio.pago_efectivo || comercio.pago_transferencia)}
                            icon={Crown}
                        />
                        <TaskItem
                            title="Personalizar personalidad"
                            reward={10}
                            completed={!!comercio.prompt_personalidad}
                            icon={Lightning}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function TaskItem({ title, reward, completed, icon: Icon }: any) {
    return (
        <div className={cn(
            "flex items-center p-4 rounded-xl border transition-all",
            completed ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-border hover:border-primary/50"
        )}>
            <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center mr-4",
                completed ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
            )}>
                <Icon size={20} weight={completed ? "fill" : "regular"} />
            </div>
            <div className="flex-1">
                <h5 className={cn("font-bold text-sm", completed && "line-through text-muted-foreground")}>{title}</h5>
                {!completed && <p className="text-xs text-emerald-600 font-bold">+{reward} créditos</p>}
            </div>
            {completed && <CheckCircle size={20} className="text-emerald-500" weight="fill" />}
        </div>
    );
}
