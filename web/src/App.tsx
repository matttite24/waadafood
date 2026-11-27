import { Routes, Route, Navigate } from 'react-router-dom';
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Toaster } from 'sonner';
import { ThemeProvider } from "./components/theme-provider";
import PanelLayout from "./components/panel/PanelLayout";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import Pedidos from "./pages/Pedidos";
import MenuPage from "./pages/MenuPage";
import Reportes from "./pages/Reportes";
import Cuenta from "./pages/Cuenta";

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
            <Toaster position="top-center" richColors />
            <Routes>
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route element={<Protected><PanelLayout /></Protected>}>
                    <Route path="/pedidos" element={<Pedidos />} />
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/reportes" element={<Reportes />} />
                    <Route path="/cuenta" element={<Cuenta />} />
                </Route>
                <Route path="*" element={<Navigate to="/pedidos" replace />} />
            </Routes>
        </ThemeProvider>
    );
}
