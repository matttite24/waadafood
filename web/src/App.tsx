import { Routes, Route, Navigate } from 'react-router-dom';
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Toaster } from 'sonner';
import { ThemeProvider } from "./components/theme-provider";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import Inicio from "./pages/Inicio";

function Protected({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, login } = useKindeAuth();
    if (isLoading) return null;
    if (!isAuthenticated) {
        login({ audience: "convex" });
        return null;
    }
    return <>{children}</>;
}

export default function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="waada-theme">
            <Toaster position="bottom-right" richColors />
            <Routes>
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route path="/" element={<Protected><Inicio /></Protected>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ThemeProvider>
    );
}
