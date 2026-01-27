import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
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

// Wrapper for protected routes to apply layout
const ProtectedLayout = () => {
    return (
        <>
            <SignedIn>
                <DashboardLayout>
                    <Outlet />
                </DashboardLayout>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </>
    );
};

function App() {
    const hostname = window.location.hostname;
    const isAppSubdomain = hostname.startsWith('app.') || hostname.includes('waadafood.matttite24.workers.dev');

    console.log("📍 Current Hostname:", hostname);
    console.log("🚀 Is App Subdomain:", isAppSubdomain);

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
