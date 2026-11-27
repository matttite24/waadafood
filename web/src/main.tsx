import { StrictMode, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { KindeProvider, useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import App from './App';
import './styles/index.css';

const { VITE_CONVEX_URL, VITE_KINDE_CLIENT_ID, VITE_KINDE_DOMAIN } = import.meta.env;

for (const [name, value] of Object.entries({ VITE_CONVEX_URL, VITE_KINDE_CLIENT_ID, VITE_KINDE_DOMAIN })) {
    if (!value) throw new Error(`Falta la variable de entorno ${name}`);
}

const convex = new ConvexReactClient(VITE_CONVEX_URL);

// Puente entre Kinde y Convex: se memoiza para evitar bucles de re-render.
function useKindeForConvex() {
    const { getToken, isLoading, isAuthenticated } = useKindeAuth();
    const fetchAccessToken = useCallback(async () => (await getToken()) || null, [getToken]);
    return useMemo(
        () => ({ isLoading, isAuthenticated, fetchAccessToken }),
        [isLoading, isAuthenticated, fetchAccessToken],
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <KindeProvider
            clientId={VITE_KINDE_CLIENT_ID}
            domain={VITE_KINDE_DOMAIN}
            logoutUri={window.location.origin}
            redirectUri={window.location.origin}
            audience="convex"
        >
            <ConvexProviderWithAuth client={convex} useAuth={useKindeForConvex}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </ConvexProviderWithAuth>
        </KindeProvider>
    </StrictMode>
);
