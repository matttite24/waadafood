import { v } from "convex/values";
import { action, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { validateBusinessHours } from "./utils";
import {
    constructSystemPrompt,
    parseAIResponse,
    detectVisualIntent
} from "./chatHelpers";
import { CHAT_CONSTANTS } from "./chatConstants";

export const answer = action({
    args: {
        comercio_id: v.id("comercios"),
        cliente_id: v.id("clientes"),
        mensaje: v.string(),
    },
    handler: async (ctx, args) => {
        console.log(`🚀 CHAT: cliente=${args.cliente_id} msg="${args.mensaje.substring(0, 40)}..."`);

        try {
            // 1. Fetch data
            const [negocio, cliente, menu] = await Promise.all([
                ctx.runQuery(internal.chat.getNegocio, { id: args.comercio_id }),
                ctx.runQuery(internal.chat.getCliente, { id: args.cliente_id }),
                ctx.runQuery(internal.chat.getMenu, { comercio_id: args.comercio_id })
            ]);

            if (!negocio) throw new Error("Negocio no encontrado");
            if (!cliente) throw new Error("Cliente no encontrado");

            // VALIDACIÓN DE CRÉDITOS
            const currentCredits = negocio.creditos ?? 0;
            if (currentCredits <= 0) {
                console.log("⚠️ Sin créditos suficientes. Escalando a humano.");
                await ctx.runMutation(api.clientes.update, {
                    id: args.cliente_id,
                    updates: {
                        requiere_atencion_humana: true,
                        motivo_escalacion: "Sistema sin créditos IA",
                        asistente_activo: false
                    }
                });

                await ctx.runMutation(api.mensajes.send, {
                    comercio_id: args.comercio_id,
                    cliente_id: args.cliente_id,
                    contenido: "Sistema: El asistente IA se ha desactivado por falta de créditos. El chat ha sido derivado a atención humana.",
                    es_ia: true,
                    es_dueno: false,
                });

                return { respuesta: "Lo siento, en este momento no puedo procesar tu solicitud. Un agente humano te atenderá pronto." };
            }

            if (!cliente.asistente_activo) {
                console.log("⚠️ Asistente desactivado");
                return;
            }

            console.log(`📦 Menu count: ${menu.length}`);
            menu.forEach(p => console.log(`   - Product: "${p.nombre}" | Foto: ${p.imagen_url ? "SI" : "NO"} | Cat: ${p.categoria}`));

            // 2. Business Hours
            const { estaAbierto, mensaje: mensajeHorario } = validateBusinessHours(
                negocio.horario_atencion,
                negocio.tiempo_limite_cierre ?? 15
            );

            // 3. Build Prompt
            const horaActual = new Date().toLocaleString("es-CO", {
                timeZone: "America/Bogota",
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            });

            const systemPrompt = constructSystemPrompt({
                negocio,
                menu,
                estaAbierto,
                mensajeHorario,
                horaActual
            });

            // 4. Build Messages (History + Current)
            const historialRaw = await ctx.runQuery(api.mensajes.list, { cliente_id: args.cliente_id });
            const historial = historialRaw.slice(-15).map((m: any) => ({
                role: m.es_ia || m.es_dueno ? "assistant" as const : "user" as const,
                content: m.contenido,
            }));

            const mensajes: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
                { role: "system", content: systemPrompt },
                ...historial,
            ];

            // 5. Build Tools
            const tools = [
                {
                    type: "function" as const,
                    function: {
                        name: "enviar_foto_producto",
                        description: "Envía la foto de un producto específico al cliente.",
                        parameters: {
                            type: "object",
                            properties: {
                                nombre: { type: "string", description: "Nombre del producto" },
                            },
                            required: ["nombre"],
                        },
                    },
                },
                {
                    type: "function" as const,
                    function: {
                        name: "enviar_menu_completo",
                        description: "Envía las imágenes de la carta o menú completo.",
                        parameters: { type: "object", properties: {} },
                    },
                },
                {
                    type: "function" as const,
                    function: {
                        name: "atencion_humana",
                        description: "Solicita ayuda de un humano cuando el cliente tiene una duda que no puedes resolver o pide hablar con una persona.",
                        parameters: {
                            type: "object",
                            properties: {
                                razon: { type: "string", description: "Breve explicación de por qué se requiere atención humana (ej: petición especial cocina, disponibilidad mesas, duda administrativa)" },
                            },
                            required: ["razon"],
                        },
                    },
                },
                {
                    type: "function" as const,
                    function: {
                        name: "crear_pedido",
                        description: "Registra un pedido finalizado en el sistema cuando el cliente ha confirmado todos los detalles.",
                        parameters: {
                            type: "object",
                            properties: {
                                items: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            nombre: { type: "string" },
                                            cantidad: { type: "number" },
                                            precio: { type: "number" }
                                        },
                                        required: ["nombre", "cantidad", "precio"]
                                    }
                                },
                                total: { type: "number", description: "Suma total del pedido" },
                                metodo_pago: { type: "string", enum: ["Efectivo", "Transferencia"] },
                                tipo_entrega: { type: "string", enum: ["domicilio", "retiro"] },
                                direccion: { type: "string", description: "Dirección de entrega (obligatorio si tipo_entrega es domicilio)" },
                                notas: { type: "string", description: "Notas opcionales o aclaraciones" }
                            },
                            required: ["items", "total", "metodo_pago", "tipo_entrega"]
                        }
                    }
                },
                {
                    type: "function" as const,
                    function: {
                        name: "gestionar_etiquetas",
                        description: "Asigna o remueve etiquetas al cliente según el contexto del chat (ej: Venta, Soporte, Reclamo).",
                        parameters: {
                            type: "object",
                            properties: {
                                etiquetas: {
                                    type: "array",
                                    items: { type: "string", description: "Nombre de la etiqueta a buscar o crear" },
                                    description: "Lista de nombres de etiquetas para el cliente"
                                },
                            },
                            required: ["etiquetas"],
                        },
                    },
                }
            ];

            // 6. OpenAI Call
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error("OPENAI_API_KEY missing");

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: CHAT_CONSTANTS.MODELO_OPENAI,
                    messages: mensajes,
                    tools,
                    tool_choice: "auto",
                    temperature: CHAT_CONSTANTS.TEMPERATURE,
                }),
            });

            const data = await response.json();
            console.log("🤖 OpenAI Response Status:", response.status);

            if (!data.choices?.[0]) {
                console.error("❌ OpenAI Error Info:", JSON.stringify(data));
                return { respuesta: "Error técnico. Intenta de nuevo." };
            }

            // 7. Process Response & Tool Calls
            const aiMessage = data.choices[0].message;
            const rawContent = aiMessage.content || "";
            const toolCalls = aiMessage.tool_calls || [];

            console.log("📝 AI Content:", rawContent);
            console.log("🛠 Tool Calls count:", toolCalls.length);
            if (toolCalls.length > 0) {
                console.log("   Tools:", JSON.stringify(toolCalls));
            }

            const parsed = parseAIResponse(rawContent);
            let { cleanResponse, intents } = parsed;

            // Handle Tool Calls
            for (const call of toolCalls) {
                if (call.function.name === "enviar_foto_producto") {
                    const { nombre } = JSON.parse(call.function.arguments);
                    console.log(`🛠 Tool: enviar_foto_producto("${nombre}")`);
                    const product = menu.find(p =>
                        p.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
                        nombre.toLowerCase().includes(p.nombre.toLowerCase())
                    );
                    if (product?.imagen_url) {
                        intents.productImages.push(product.imagen_url);
                        if (!cleanResponse) cleanResponse = `¡Claro! Aquí tienes la foto de ${product.nombre}:`;
                    }
                }
                if (call.function.name === "enviar_menu_completo") {
                    console.log("🛠 Tool: enviar_menu_completo");
                    intents.sendMenu = true;
                    if (!cleanResponse) cleanResponse = "¡Con gusto! Aquí tienes nuestro menú:";
                }
                if (call.function.name === "atencion_humana") {
                    const { razon } = JSON.parse(call.function.arguments);
                    console.log(`🛠 Tool: atencion_humana("${razon}")`);
                    intents.chatManual = razon;
                }
                if (call.function.name === "crear_pedido") {
                    const params = JSON.parse(call.function.arguments);
                    console.log("🛠 Tool: crear_pedido", JSON.stringify(params));

                    const resumen = params.items.map((i: any) => `${i.cantidad}x ${i.nombre}`).join(", ");

                    await ctx.runMutation(api.pedidos.create, {
                        comercio_id: args.comercio_id,
                        cliente_id: args.cliente_id,
                        estado: "pendiente",
                        total: params.total,
                        resumen_pedido: resumen,
                        detalles: {
                            items: params.items,
                            metodo_pago: params.metodo_pago,
                            tipo_entrega: params.tipo_entrega,
                            direccion: params.direccion,
                            notas: params.notas
                        },
                        cliente_nombre: cliente.nombre_usuario || "",
                        cliente_telefono: cliente.telefono || "",
                        direccion_entrega: params.direccion || ""
                    });

                    // Limpiar pedido_actual y DESACTIVAR asistente para evitar duplicidad
                    // También activamos requiere_atencion_humana para que el dueño vea la notificación del nuevo pedido
                    await ctx.runMutation(api.clientes.update, {
                        id: args.cliente_id,
                        updates: {
                            pedido_actual: null,
                            asistente_activo: false,
                            requiere_atencion_humana: true,
                            motivo_escalacion: "Pedido Finalizado"
                        }
                    });
                }
                if (call.function.name === "gestionar_etiquetas") {
                    const { etiquetas } = JSON.parse(call.function.arguments);
                    console.log(`🛠 Tool: gestionar_etiquetas(${etiquetas.join(", ")})`);

                    // 1. Obtener todas las etiquetas del comercio
                    const tagsExistentes = await ctx.runQuery(api.etiquetas.listByComercio, { comercio_id: args.comercio_id });

                    const finalTagIds: any[] = [];

                    for (const tagName of etiquetas) {
                        let tag = tagsExistentes.find(t => t.nombre.toLowerCase() === tagName.toLowerCase());
                        if (tag) {
                            finalTagIds.push(tag._id);
                        } else {
                            // Si no existe, la creamos (con un color por defecto o aleatorio)
                            const newTagId = await ctx.runMutation(api.etiquetas.create, {
                                comercio_id: args.comercio_id,
                                nombre: tagName,
                                color: "#00754A" // Default brand color
                            });
                            finalTagIds.push(newTagId);
                        }
                    }

                    if (finalTagIds.length > 0) {
                        await ctx.runMutation(api.etiquetas.aplicarEtiquetas, {
                            cliente_id: args.cliente_id,
                            etiquetas_ids: finalTagIds
                        });
                    }
                }
            }

            // 8. DETERMINISTIC FAIL-SAFE: Force images if user asked but AI failed
            const forcedImages = detectVisualIntent(args.mensaje, menu);
            if (forcedImages.length > 0) {
                console.log("👮 Deterministic Fail-safe activated:", forcedImages.length, "images found");
                forcedImages.forEach(url => {
                    if (!intents.productImages.includes(url)) {
                        intents.productImages.push(url);
                    }
                });

                // Override AI refusal or very short responses
                const refusalKeywords = ["no tengo", "no dispongo", "no puedo", "lo siento", "perdón", "no hay", "no se"];
                const isRefusal = refusalKeywords.some(k => cleanResponse.toLowerCase().includes(k));

                if (isRefusal || cleanResponse.length < 5) {
                    console.log("📝 Overriding AI refusal with positive confirmation");
                    cleanResponse = "¡Claro que sí! Aquí tienes lo que pediste: 📸";
                }
            } else {
                console.log("👮 No forced images detected for this message.");
            }

            // 9. Handle Escalation
            if (intents.chatManual) {
                await ctx.runMutation(api.clientes.update, {
                    id: args.cliente_id,
                    updates: {
                        requiere_atencion_humana: true,
                        motivo_escalacion: intents.chatManual,
                        asistente_activo: false
                    }
                });
            }

            // 10. Save Messages to DB
            // Text message first
            if (cleanResponse) {
                await ctx.runMutation(api.mensajes.send, {
                    comercio_id: args.comercio_id,
                    cliente_id: args.cliente_id,
                    contenido: cleanResponse,
                    es_ia: true,
                    es_dueno: false,
                });

                // DESCONTAR CRÉDITO
                await ctx.runMutation(api.comercios.consumirCredito, {
                    id: args.comercio_id
                });
            }

            // Menu images
            const imaMenu = negocio.imagenes_menu || [];
            if (intents.sendMenu && imaMenu.length > 0) {
                for (const url of imaMenu) {
                    await ctx.runMutation(api.mensajes.send, {
                        comercio_id: args.comercio_id,
                        cliente_id: args.cliente_id,
                        contenido: "Menú",
                        es_ia: true,
                        es_dueno: false,
                        imagenes: [url]
                    });
                }
            }

            // Product images
            if (intents.productImages.length > 0) {
                for (const url of intents.productImages) {
                    await ctx.runMutation(api.mensajes.send, {
                        comercio_id: args.comercio_id,
                        cliente_id: args.cliente_id,
                        contenido: "📸",
                        es_ia: true,
                        es_dueno: false,
                        imagenes: [url]
                    });
                }
            }

            return { respuesta: cleanResponse };

        } catch (error: any) {
            console.error("❌ Error:", error.message || error);
            return { respuesta: "Lo siento, ocurrió un error. Intenta de nuevo." };
        }
    },
});

// === INTERNAL QUERIES ===
export const getNegocio = internalQuery({
    args: { id: v.id("comercios") },
    handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getCliente = internalQuery({
    args: { id: v.id("clientes") },
    handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getMenu = internalQuery({
    args: { comercio_id: v.id("comercios") },
    handler: async (ctx, args) => {
        const productos = await ctx.db
            .query("productos")
            .withIndex("by_comercio", q => q.eq("comercio_id", args.comercio_id))
            .filter(q => q.eq(q.field("disponible"), true))
            .collect();

        // Convert Storage IDs to URLs
        const productosConUrls = await Promise.all(
            productos.map(async (p) => {
                if (p.imagen_url && !p.imagen_url.startsWith("http")) {
                    const url = await ctx.storage.getUrl(p.imagen_url);
                    return { ...p, imagen_url: url || null };
                }
                return p;
            })
        );

        return productosConUrls;
    },
});
