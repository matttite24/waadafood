import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SignOut, Key, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

export function AccountSettings() {
    const { user, logout } = useKindeAuth();

    const handleSignOut = async () => {
        try {
            await logout();
            toast.success("Sesión cerrada");
        } catch (error) {
            toast.error("Error al cerrar sesión");
        }
    };

    return (
        <div className="space-y-8 max-w-2xl animate-in fade-in duration-500 pb-10">
            <div>
                <h3 className="text-xl font-black font-display tracking-tight">Cuenta y Seguridad</h3>
                <p className="text-sm text-muted-foreground">Gestiona tu perfil personal y seguridad de la cuenta.</p>
            </div>

            {/* Perfil */}
            <div className="flex flex-col items-center p-8 bg-background border rounded-[2.5rem] space-y-4 shadow-sm">
                <Avatar className="h-24 w-24 border-4 border-primary/10">
                    <AvatarImage src={user?.picture || undefined} />
                    <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                        {(user as any)?.given_name?.charAt(0) || "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h4 className="text-2xl font-bold tracking-tight">{(user as any)?.given_name} {(user as any)?.family_name}</h4>
                    <p className="text-muted-foreground text-sm font-medium">{user?.email}</p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="rounded-full mt-2 gap-2 text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600 font-bold text-xs uppercase tracking-widest px-6"
                >
                    <SignOut size={18} weight="bold" />
                    Cerrar Sesión
                </Button>
            </div>

            {/* Seguridad */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-4">SEGURIDAD</h4>
                <div className="grid gap-3">
                    <div className="flex items-center justify-between p-5 bg-background border rounded-3xl hover:border-primary/20 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <Key size={22} weight="bold" />
                            </div>
                            <div>
                                <h5 className="font-bold text-sm">Contraseña</h5>
                                <p className="text-xs text-muted-foreground">Gestionado vía Kinde Auth</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="rounded-full text-primary font-bold text-xs">Cambiar</Button>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-background border rounded-3xl hover:border-red-200 transition-all group cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
                                <Trash size={22} weight="bold" />
                            </div>
                            <div>
                                <h5 className="font-bold text-sm text-red-600">Eliminar Cuenta</h5>
                                <p className="text-xs text-muted-foreground">Acción permanente e irreversible</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
