// Production build trigger v1.0.1
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import App from './App';
import './styles/index.css';

console.log("🔗 VITE_CONVEX_URL present:", !!import.meta.env.VITE_CONVEX_URL);
console.log("🔑 VITE_CLERK_PUBLISHABLE_KEY present:", !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!convexUrl) {
    console.error("❌ ERROR: VITE_CONVEX_URL is missing! The app will not work.");
}

const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud");

// Determine the domain for Clerk (needed for custom domains in production)
const domain = window.location.hostname.includes("localhost") ? undefined : "waadafood.com";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ClerkProvider publishableKey={clerkPubKey} domain={domain}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </ConvexProviderWithClerk>
        </ClerkProvider>
    </StrictMode>
);
