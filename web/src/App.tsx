import { Routes, Route, Navigate } from 'react-router-dom';
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Toaster } from 'sonner';
import { Button } from "./components/ui/button";
import { ThemeProvider } from "./components/theme-provider";
import PanelLayout from "./components/panel/PanelLayout";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import Pedidos from "./pages/Pedidos";
import MenuPage from "./pages/MenuPage";
import Reportes from "./pages/Reportes";
import Cuenta from "./pages/Cuenta";
import MiQR from "./pages/MiQR";

/** Rutas privadas: sin sesión se vuelve a la portada. No se llama a login() solo, para que cerrar sesión se note. */
function Protected({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useKindeAuth();
    if (isLoading) return null;
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return <>{children}</>;
}

/** Portada pública: aquí aterrizas al cerrar sesión. Con sesión activa pasa directo al panel. */
function Portada() {
    const { isAuthenticated, isLoading, login, register } = useKindeAuth();
    if (isLoading) return null;
    if (isAuthenticated) return <Navigate to="/pedidos" replace />;
    return (
        <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6 text-center">
            <h1 className="text-3xl font-bold">Waada Panel</h1>
            <p className="text-muted-foreground">Recibe pedidos por WhatsApp, con su ubicación en el mapa.</p>
            <Button className="h-12" onClick={() => login({ audience: "convex" })}>Entrar</Button>
            <Button variant="outline" className="h-12" onClick={() => register({ audience: "convex" })}>Crear cuenta</Button>
        </main>
    );
}

export default function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="waada-theme">
            <Toaster position="top-center" richColors offset={{ top: "calc(env(safe-area-inset-top) + 64px)" }} />
            <Routes>
                <Route path="/" element={<Portada />} />
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route element={<Protected><PanelLayout /></Protected>}>
                    <Route path="/pedidos" element={<Pedidos />} />
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/reportes" element={<Reportes />} />
                    <Route path="/cuenta" element={<Cuenta />} />
                    <Route path="/cuenta/qr" element={<MiQR />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ThemeProvider>
    );
}
