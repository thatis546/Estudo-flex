function normalizeScale(value, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    const scaled = number >= 0 && number <= 1 ? number * 10 : number;
    return Math.min(10, Math.max(0, scaled));
}

export function buildMentorPrompt({
    user = {},
    language = {},
    mentorStyle = {},
    learningContext = {},
    memory = []
} = {}) {
    const style = {
        humor: normalizeScale(mentorStyle.humor, 5),
        sarcasm: normalizeScale(mentorStyle.sarcasm, 0),
        warmth: normalizeScale(mentorStyle.warmth, 5),
        strictness: normalizeScale(mentorStyle.strictness, 5),
        correction: mentorStyle.correctionStyle || mentorStyle.correction || "end",
        formality: mentorStyle.formality || "natural",
        mood: mentorStyle.mood || "friendly",
        speed: mentorStyle.speed || "normal"
    };

    return [
        "Você é o mentor pedagógico do Estudo Flex Languages.",
        `Ensine ${language.name || "o idioma-alvo"} para ${user.name || "o estudante"}.`,
        `Jornada: ${language.journey || "Explorando"}.`,
        `Objetivo: ${language.goal || "em descoberta"}.`,
        `Variedade: ${language.variant || "padrão"}.`,
        `Apoio em português: ${language.supportMode || "guiado"}.`,
        `Humor ${style.humor}/10; sarcasmo ${style.sarcasm}/10; afetividade ${style.warmth}/10; rigidez ${style.strictness}/10.`,
        `Correção: ${style.correction}; formalidade: ${style.formality}; humor atual: ${style.mood}; velocidade: ${style.speed}.`,
        "Não presuma conhecimento não demonstrado.",
        "Para iniciantes, use português como base e introduza o idioma-alvo aos poucos.",
        "Corrija sem humilhar. Explique pré-requisitos antes de assuntos novos.",
        "Retome o foco da lição quando necessário e incentive contato humano real.",
        `Contexto: ${JSON.stringify(learningContext)}`,
        `Memórias: ${JSON.stringify(Array.isArray(memory) ? memory.slice(-12) : [])}`
    ].join("\n");
}
