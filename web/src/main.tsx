// Production build trigger v1.0.2 - Stable Kinde Auth
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { KindeProvider, useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { ConvexProviderWithAuth } from "convex/react";
import { ConvexReactClient } from 'convex/react';
import App from './App';
import './styles/index.css';

const hostname = window.location.hostname;
const isProduction = hostname === 'app.waadafood.com';

// Forzar URL de producción si estamos en el dominio real para evitar fallos de configuración en Cloudflare
const convexUrl = isProduction
    ? 'https://strong-herring-329.convex.cloud'
    : (import.meta.env.VITE_CONVEX_URL || "https://mellow-snake-909.convex.cloud");

console.log("📍 Current Hostname:", hostname);
console.log("🌐 Selected Convex URL:", convexUrl);

if (!convexUrl) {
    console.error("❌ ERROR: VITE_CONVEX_URL is missing!");
}

const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud");

// Wrapper for Convex and Kinde integration
function ConvexProviderWithKinde({ children }: { children: React.ReactNode }) {
    const { getToken, isLoading, isAuthenticated } = useKindeAuth();

    return (
        <ConvexProviderWithAuth
            client={convex}
            useAuth={() => ({
                isLoading,
                isAuthenticated,
                fetchAccessToken: async () => {
                    const token = await getToken();
                    if (!token) console.warn("⚠️ No token received from Kinde");
                    return token || null;
                },
            })}
        >
            {children}
        </ConvexProviderWithAuth>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <KindeProvider
            clientId="623e33511e11481486f9bb40fb2d7cac"
            domain="https://waadafood.kinde.com"
            logoutUri={window.location.origin}
            redirectUri={window.location.origin}
            audience="convex"
        >
            <ConvexProviderWithKinde>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </ConvexProviderWithKinde>
        </KindeProvider>
    </StrictMode>
);
