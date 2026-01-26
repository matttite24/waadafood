import { useUser } from "@clerk/clerk-react";

interface WelcomeHeaderProps {
    businessName?: string;
}

export function WelcomeHeader({ businessName }: WelcomeHeaderProps) {
    const { user } = useUser();
    const firstName = user?.firstName || "Usuario";

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Buenos días";
        if (hour < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
                    {getGreeting()}, {firstName} 👋
                </h1>
                <p className="text-muted-foreground mt-1 text-lg">
                    {businessName ? `${businessName} está activo.` : "Tu negocio está activo."}
                </p>
            </div>
        </div>
    );
}
