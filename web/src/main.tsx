// Production build trigger v1.0.1
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { KindeProvider, useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { ConvexProviderWithAuth } from "convex/react";
import { ConvexReactClient } from 'convex/react';
import App from './App';
import './styles/index.css';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
    console.error("❌ ERROR: VITE_CONVEX_URL is missing! The app will not work.");
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
        >
            <ConvexProviderWithKinde>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </ConvexProviderWithKinde>
        </KindeProvider>
    </StrictMode>
);
