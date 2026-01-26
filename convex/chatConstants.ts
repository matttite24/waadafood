export const CHAT_CONSTANTS = {
    MODELO_OPENAI: "gpt-4o-mini",
    TEMPERATURE: 0,
    MAX_TOKENS: 1000,
};

export const PALABRAS_OFENSIVAS = [
    "hijo de puta", "gonorrea", "malparido", "estúpido", "estupido", "imbécil", "imbecil",
    "mierda", "pendejo", "carechimba", "tonteras", "tontera", "porquería", "porqueria",
    "basura", "asco", "pésimo", "pesimo", "estafa", "estafadores"
];

export const PALABRAS_CONFIRMACION = [
    "sí", "si", "ok", "confirmo", "adelante", "está bien", "esta bien",
    "listo", "va", "dale", "perfecto", "todo bien", "gracias", "eso es",
    "correcto", "exacto", "así es", "claro", "por favor", "ya", "eso",
    "confirmado", "de acuerdo", "procede", "hazlo", "está listo"
];

export const PREGUNTAS_ESTADO = [
    "ya esta", "confirmaste", "lo guardaste", "está listo", "ya lo hiciste"
];

export const PALABRAS_CLAVE_ESCALACION = [
    "supervisor", "agente humano", "pasarte con", "atención humana", "ayuda de un humano"
];
