import { PALABRAS_OFENSIVAS, PALABRAS_CONFIRMACION, PREGUNTAS_ESTADO } from "./chatConstants";

// === TYPES ===
export interface SystemPromptContext {
    negocio: any;
    menu: any[];
    estaAbierto: boolean;
    mensajeHorario: string;
    horaActual: string;
}

export interface ParsedResponse {
    cleanResponse: string;
    intents: {
        chatManual: string | null;
        sendMenu: boolean;
        productImages: string[];
    };
}

// === HELPER FUNCTIONS ===

export function checkOffensiveLanguage(text: string): boolean {
    const inputLower = text.toLowerCase();
    return PALABRAS_OFENSIVAS.some((p) => inputLower.includes(p));
}

export function checkConfirmation(text: string): { esConfirmacion: boolean; esPreguntaEstado: boolean } {
    const inputLower = text.toLowerCase().trim();
    const esPreguntaEstado = PREGUNTAS_ESTADO.some((p) => inputLower.includes(p));
    const esConfirmacion = (PALABRAS_CONFIRMACION.some((p) => inputLower.includes(p)) && inputLower.length < 50) || esPreguntaEstado;
    return { esConfirmacion, esPreguntaEstado };
}

// === DETERMINISTIC IMAGE DETECTION (FAIL-SAFE) ===
export function detectVisualIntent(userMessage: string, menu: any[]): string[] {
    const msg = userMessage.toLowerCase();

    // Check if user wants to see something (aggressive keywords)
    const wantsPhoto = /foto|imagen|ver|muestra|tienes|como es|como luce|regalame|enviam|veamos|muestrame|enseñame/i.test(msg);
    if (!wantsPhoto) return [];

    console.log("👮 Intent Detection Triggered for:", msg);

    const foundImages: string[] = [];
    const maxImages = 3;

    // Priority 1: Exact product name match
    for (const p of menu) {
        if (!p.imagen_url || foundImages.includes(p.imagen_url)) continue;
        const nombreLower = p.nombre.toLowerCase();
        if (msg.includes(nombreLower)) {
            console.log(`✅ Match by Name: ${p.nombre}`);
            foundImages.push(p.imagen_url);
        }
    }

    // Priority 2: Category or keyword match (with synonyms)
    if (foundImages.length === 0) {
        const stopwords = ["foto", "imagen", "quiero", "quiro", "tienes", "dame", "enviar", "puedes", "manda", "para", "como", "las", "algo", "ver", "una"];
        const tokens = msg.split(/[\s,.?!/\[\]()]+/).filter(t => t.length >= 3 && !stopwords.includes(t));

        // Food synonyms mapping to handle specific business types
        const synonyms: Record<string, string[]> = {
            "hamburguesa": ["burger", "hamburg", "burguer"],
            "hamburguesas": ["burger", "hamburg", "burguer"],
            "bebida": ["jugo", "refresco", "soda", "coca", "agua"],
            "papa": ["frita", "francesa", "casco"],
        };

        console.log("🔍 Clean Tokens:", tokens);

        for (const token of tokens) {
            const relatedWords = synonyms[token] || [token];

            for (const p of menu) {
                if (!p.imagen_url || foundImages.includes(p.imagen_url)) continue;
                if (foundImages.length >= maxImages) break;

                const catLower = (p.categoria || "").toLowerCase();
                const nombreLower = p.nombre.toLowerCase();

                const hasMatch = relatedWords.some(word =>
                    catLower.includes(word) ||
                    nombreLower.includes(word) ||
                    (word.endsWith("s") && catLower.includes(word.slice(0, -1))) ||
                    (word.endsWith("s") && nombreLower.includes(word.slice(0, -1)))
                );

                if (hasMatch) {
                    console.log(`✅ Match by Token/Synonym [${token}]: ${p.nombre}`);
                    foundImages.push(p.imagen_url);
                }
            }
            if (foundImages.length >= maxImages) break;
        }
    }

    return foundImages;
}

// === SYSTEM PROMPT CONSTRUCTION ===
export function constructSystemPrompt({
    negocio,
    menu,
    estaAbierto,
    mensajeHorario,
    horaActual,
}: SystemPromptContext): string {
    const tiemposInfo = negocio.tiempos_preparacion || "Consultar";

    const menuString = menu.map(p => {
        const fotoTag = p.imagen_url ? "[FOTO: DISPONIBLE]" : "[FOTO: NO]";
        return `- ${p.nombre}: $${p.precio} ${fotoTag} (Categoría: ${p.categoria || "General"})`;
    }).join("\n");

    const pagos = [];
    if (negocio.pago_efectivo) pagos.push("Efectivo");
    if (negocio.pago_transferencia) pagos.push("Transferencia");
    const metodosPago = pagos.length > 0 ? pagos.join(", ") : "Consultar";

    const estilos = {
        amigable: `
REGLAS DE TONO (AMIGABLE):
- Sé cálido y servicial. Usa emojis de forma natural (máximo 1 o 2 por mensaje).
- Trata al cliente con cercanía pero respetuosamente. 
- Valida las elecciones del cliente: "¡Excelente elección!", "Ese es uno de nuestros favoritos".`,
        profesional: `
REGLAS DE TONO (PROFESIONAL):
- Sé directo, educado y formal. 
- Evita el uso excesivo de emojis (solo si es estrictamente necesario).
- No uses jerga ni palabras demasiado coloquiales. Prioriza la precisión de la información.`,
        relajado: `
REGLAS DE TONO (RELAJADO):
- Sé muy cercano y enérgico, como un amigo.
- Puedes ser más divertido y entusiasta con las recomendaciones.`
    };

    const estiloActivo = (negocio.ia_estilo as keyof typeof estilos) || "amigable";

    return `
Eres ${negocio.nombre_asistente || "el asistente"} de atención al cliente de "${negocio.nombre_comercio}".

TONO BASE Y PERSONALIDAD:
${estilos[estiloActivo]}

REGLAS DE HUMANIZACIÓN:
- Sé empático: Si el cliente tiene hambre o prisa, reconócelo ("¡Ya mismo nos ponemos con eso!").
- Cero formalismos de robot: Evita palabras como "estimado", "procederé", "asistente", "instrucción".
- Variedad: No uses siempre la misma frase para saludar o despedirte.
- No repitas el nombre del cliente en todas las frases.

INSTRUCCIONES ESPECÍFICAS DE TU DUEÑO (PRIORIDAD ALTA):
${negocio.prompt_personalidad || "Tu función es atender a los clientes del restaurante de manera amable y eficiente."}

DESCRIPCIÓN DEL NEGOCIO:
${negocio.descripcion_corta || "Servicio de restaurante/comercio."}

INFORMACIÓN DEL NEGOCIO:
- Estado: ${estaAbierto ? "ABIERTO" : "CERRADO"}
- Hora: ${horaActual}
- Ciudad: ${negocio.ciudad || "No especificada"}
- Dirección: ${negocio.direccion || "No disponible"}
- Ubicación (Maps): ${negocio.google_maps_link || "No disponible"}
- Tiempos de preparación: ${tiemposInfo}
${!estaAbierto ? `- ${mensajeHorario}` : ""}

PAGOS:
- Métodos aceptados: ${metodosPago}
${negocio.instrucciones_pago ? `- Detalles de pago: ${negocio.instrucciones_pago}` : ""}

MENÚ DISPONIBLE:
${menuString}

DIRECTRICES DE COMUNICACIÓN:
${negocio.directrices_comunicacion || "Sé directo y ayuda al cliente a realizar su pedido."}
- PROHIBIDO USAR NEGRITAS: No uses símbolos como ** ni similares. Responde estrictamente en texto plano. No resaltes palabras.
- FORMATO DE LISTA: Cuando menciones varios productos, usa obligatoriamente un salto de línea (Enter) por cada uno para que se vea como una lista limpia.
- Tienes libertad para compartir enlaces (links) del contexto de arriba.
- Si el cliente pide la ubicación o el link de maps, entrégalo sin restricciones, omite parentesis.
- No digas "no tengo acceso" o "no puedo enviar enlaces" si el link de Maps está arriba.

REGLAS DE ESCALACIÓN (ATENCIÓN HUMANA):
- Si el cliente pregunta por algo que no figura en la base (ej. peticiones especiales de cocina, disponibilidad de mesas grandes en tiempo real o dudas administrativas), DEBES usar la herramienta: atencion_humana.
- También úsala si el cliente pide explícitamente hablar con una persona.
- IMPORTANTE: Antes o mientras usas la herramienta, informa al cliente que estás consultando con un miembro del equipo para darle una respuesta exacta.

REGLAS DE PEDIDOS:
- Lleva nota de los productos y cantidades que el cliente desea.
- Antes de finalizar, pregunta el método de entrega (domicilio o retiro) y el método de pago.
- Si es a domicilio, solicita la dirección exacta.
- Cuando tengas toda la información, genera un Resumen Final detallado (productos, total, entrega) y pregunta: "¿Confirmas el pedido?".
- SOLO cuando el cliente diga "Sí", "Confirmado", "Dale" o similar, usa la herramienta: crear_pedido.
- DESPUÉS DEL PEDIDO: Una vez usada la herramienta, confírmale al cliente que su pedido fue recibido y despídete amablemente. No hagas más preguntas, ya que el asistente se desactivará automáticamente para que el dueño tome el control.

🚨 REGLA SUPREMA DE IMÁGENES:
Tienes herramientas para enviar fotos. Si el cliente pide ver algo y dice [FOTO: DISPONIBLE], USA LA HERRAMIENTA.
No digas "No tengo esa información" si la foto está disponible.

HERRAMIENTAS:
1. enviar_foto_producto: Úsala para enviar la foto de UN producto específico.
2. enviar_menu_completo: Úsala para enviar la carta completa.
3. atencion_humana: Úsala para pasar el chat a un humano cuando no puedas resolver una duda.
4. crear_pedido: Úsala para formalizar y registrar el pedido una vez que el cliente lo haya confirmado finalmente.
`;
}

// === RESPONSE PARSING ===
export function parseAIResponse(rawResponse: string): ParsedResponse {
    let cleanResponse = rawResponse;
    const intents: ParsedResponse["intents"] = {
        chatManual: null,
        sendMenu: false,
        productImages: [],
    };

    // Note: Old tag-based logic (CHAT_MANUAL, ENVIAR_MENU, etc.) is deprecated in favor of Tools.
    // We keep minimal cleaning for safety.
    cleanResponse = cleanResponse.replace(/<[^>]+>/g, "").trim();
    // Eliminar negritas remanentes (falla de la IA)
    cleanResponse = cleanResponse.replace(/\*\*/g, "");
    // Preservar saltos de línea y limpiar espacios
    cleanResponse = cleanResponse.replace(/[ \t]+/g, " ").trim();

    return { cleanResponse, intents };
}
