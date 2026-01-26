import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Warning, Receipt } from "@phosphor-icons/react";

interface CommandCardsProps {
    urgentChatsCount: number;
    pendingOrdersCount: number;
    incompleteSalesCount?: number; // Optional as not in initial scope but good to have
}

export function CommandCards({ urgentChatsCount, pendingOrdersCount }: CommandCardsProps) {
    const navigate = useNavigate();

    // Only show cards if there are items to address
    if (urgentChatsCount === 0 && pendingOrdersCount === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {urgentChatsCount > 0 && (
                <Card className="bg-red-50/50 border-transparent transition-all group">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center transition-colors duration-200">
                                <Warning size={24} weight="fill" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg text-foreground">
                                    {urgentChatsCount} {urgentChatsCount === 1 ? 'Cliente espera' : 'Clientes esperan'}
                                </h3>
                                <p className="text-muted-foreground text-sm">Requieren atención humana</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/chats?filter=Urgente')}
                            className="bg-white text-red-600 hover:bg-red-50 border border-red-200"
                        >
                            Responder
                        </Button>
                    </CardContent>
                </Card>
            )}

            {pendingOrdersCount > 0 && (
                <Card className="bg-amber-50/50 border-transparent transition-all group">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center transition-colors duration-200">
                                <Receipt size={24} weight="fill" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg text-foreground">
                                    {pendingOrdersCount} {pendingOrdersCount === 1 ? 'Pedido pendiente' : 'Pedidos pendientes'}
                                </h3>
                                <p className="text-muted-foreground text-sm">Por confirmar o preparar</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/pedidos')}
                            className="bg-white text-amber-600 hover:bg-amber-50 border border-amber-200"
                        >
                            Gestionar
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
