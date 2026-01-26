import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

/**
 * WEBHOOK PARA META (Messenger, Instagram y WhatsApp)
 * Esta ruta manejará tanto la verificación inicial (GET) como los mensajes (POST).
 */
http.route({
    path: "/webhooks/meta",
    method: "GET",
    handler: httpAction(async (_ctx, request) => {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get("hub.mode");
        const token = searchParams.get("hub.verify_token");
        const challenge = searchParams.get("hub.challenge");

        // "WAADA_SECRET_TOKEN" es el código que tú inventes y pegues en el panel de Meta.
        // Cámbialo por algo seguro antes de subirlo.
        if (mode === "subscribe" && token === "WAADA_SECRET_TOKEN") {
            console.log("✅ Webhook verificado correctamente por Meta");
            return new Response(challenge, { status: 200 });
        }

        console.error("❌ Error de verificación: Token o modo incorrecto");
        return new Response("Forbidden", { status: 403 });
    }),
});

http.route({
    path: "/webhooks/meta",
    method: "POST",
    handler: httpAction(async (_ctx, request) => {
        const payload = await request.json();

        // Registramos el mensaje en la consola para que puedas verlo en tu terminal de Convex
        console.log("📩 Nuevo evento recibido:", JSON.stringify(payload, null, 2));

        /** * NOTA PARA EL SAAS Y COEXISTENCIA:
         * Aquí es donde filtrarás los "Ecos". Si el dueño del restaurante responde desde
         * su app de WhatsApp Business, recibirás un mensaje con 'from_me: true'.
         * Tu código debe detectar eso para no responderse a sí mismo.
         */

        // Siempre responde con 200 OK a Meta para confirmar recepción
        return new Response("EVENT_RECEIVED", { status: 200 });
    }),
});

export default http;