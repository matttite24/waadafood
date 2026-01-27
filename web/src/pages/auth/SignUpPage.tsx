import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useEffect } from "react";

export default function SignUpPage() {
    const { register, isAuthenticated, isLoading } = useKindeAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            register({
                audience: "convex"
            });
        }
    }, [isLoading, isAuthenticated, register]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground font-medium">Redirigiendo a registro de Kinde...</p>
            </div>
        </div>
    );
}
