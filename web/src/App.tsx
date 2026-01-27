import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Toaster } from 'sonner';
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ThemeProvider } from "./components/theme-provider";

// Pages
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import DashboardHome from "./pages/dashboard/DashboardHome";
import ChatsPage from "./pages/dashboard/ChatsPage";
import PedidosPage from "./pages/dashboard/PedidosPage";
import MetricsPage from "./pages/dashboard/MetricsPage";
import MenuPage from "./pages/dashboard/MenuPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import SandboxPage from "./pages/SandboxPage";

// Wrapper for protected routes using Kinde
const ProtectedLayout = () => {
    const { isAuthenticated, isLoading, login } = useKindeAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Cargando WaadaFood v1.0.7...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        login();
        return null;
    }

    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    );
};

function App() {
    const hostname = window.location.hostname;
    const isAppSubdomain = hostname.startsWith('app.') || hostname.includes('waadafood.matttite24.workers.dev') || hostname.includes('localhost');
    const isMainDomain = hostname === 'waadafood.com' || hostname === 'www.waadafood.com';

    // Redirigir al subdominio app si se intenta acceder a rutas de la app desde el dominio principal
    if (isMainDomain && window.location.pathname !== '/' && window.location.pathname !== '/home') {
        window.location.replace(`https://app.waadafood.com${window.location.pathname}${window.location.search}`);
        return null;
    }

    console.log("📍 Current Hostname:", hostname);
    console.log("🚀 Is App Subdomain:", isAppSubdomain);
    console.log("🔗 VITE_CONVEX_URL:", !!import.meta.env.VITE_CONVEX_URL);

    return (
        <ThemeProvider defaultTheme="light" storageKey="chatbox-theme">
            <div className="min-h-screen bg-background font-sans text-foreground">
                <Toaster position="bottom-right" richColors />

                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/"
                        element={isAppSubdomain ? <Navigate to="/overview" replace /> : <LandingPage />}
                    />
                    <Route path="/home" element={<LandingPage />} />
                    <Route path="/sign-in/*" element={<SignInPage />} />
                    <Route path="/sign-up/*" element={<SignUpPage />} />
                    <Route path="/sandbox/:comercioId" element={<SandboxPage />} />

                    {/* Dashboard / App Routes (Protected & Clean URLs) */}
                    <Route element={<ProtectedLayout />}>
                        <Route path="/overview" element={<DashboardHome />} />
                        <Route path="/chats" element={<ChatsPage />} />
                        <Route path="/pedidos" element={<PedidosPage />} />
                        <Route path="/metricas" element={<MetricsPage />} />
                        <Route path="/menu" element={<MenuPage />} />
                        <Route path="/configuracion" element={<SettingsPage />} />
                    </Route>

                    {/* Redirects */}
                    <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </ThemeProvider>
    );
}

export default App;
