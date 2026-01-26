import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";

if (!convexUrl) {
    console.warn("EXPO_PUBLIC_CONVEX_URL no definida. Asegúrate de configurar las variables de entorno después de ejecutar npx convex dev.");
}

export const convex = new ConvexReactClient(convexUrl);
