export const JOURNEY_LEVELS = [
    {
        id: "explorando",
        label: "Explorando",
        order: 0,
        description: "Primeiros contatos, sons, cumprimentos e palavras essenciais.",
        legacyCefr: "A0"
    },
    {
        id: "descobrindo",
        label: "Descobrindo",
        order: 1,
        description: "Compreende e produz frases simples em situações familiares.",
        legacyCefr: "A1"
    },
    {
        id: "construindo",
        label: "Construindo",
        order: 2,
        description: "Constrói conversas curtas e resolve necessidades práticas.",
        legacyCefr: "A2"
    },
    {
        id: "conectando",
        label: "Conectando",
        order: 3,
        description: "Conecta ideias, sustenta conversas e adapta a linguagem ao contexto.",
        legacyCefr: "B1-B2"
    },
    {
        id: "vivendo",
        label: "Vivendo o idioma",
        order: 4,
        description: "Usa o idioma com autonomia em experiências reais e variadas.",
        legacyCefr: "C1-C2"
    }
];

const JOURNEY_BY_ID = new Map(JOURNEY_LEVELS.map((journey) => [journey.id, journey]));
const JOURNEY_BY_LABEL = new Map(JOURNEY_LEVELS.map((journey) => [journey.label.toLocaleLowerCase("pt-BR"), journey]));

export function getJourney(value, fallback = "explorando") {
    const normalized = String(value ?? "").trim().toLocaleLowerCase("pt-BR");
    return JOURNEY_BY_ID.get(normalized) || JOURNEY_BY_LABEL.get(normalized) || JOURNEY_BY_ID.get(fallback);
}

export function getJourneyLabel(value) {
    return getJourney(value)?.label || "Explorando";
}

export function journeyFromLegacyCefr(value) {
    const cefr = String(value ?? "").trim().toUpperCase();
    if (["C1", "C2"].includes(cefr)) return "conectando";
    if (["B1", "B2"].includes(cefr)) return "conectando";
    if (cefr === "A2") return "construindo";
    if (cefr === "A1") return "descobrindo";
    return "explorando";
}

export function getNextJourney(value) {
    const current = getJourney(value);
    return JOURNEY_LEVELS[Math.min(JOURNEY_LEVELS.length - 1, current.order + 1)];
}
