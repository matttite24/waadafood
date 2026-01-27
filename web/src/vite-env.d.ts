/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CONVEX_URL: string;
    readonly VITE_KINDE_CLIENT_ID: string;
    readonly VITE_KINDE_DOMAIN: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
