import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useEffect } from "react";

export default function SignInPage() { // Production build trigger v1.0.6 - Explicit Audience
    const { login, isAuthenticated, isLoading } = useKindeAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            login({
                audience: "convex"
            });
        }
    }, [isLoading, isAuthenticated, login]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground font-medium">Redirigiendo a Kinde...</p>
            </div>
        </div>
    );
}
